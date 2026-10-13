import asyncio
import logging
from typing import Dict, Any, Optional
import httpx
from ..core.config import settings

logger = logging.getLogger(__name__)


class RunPodClient:
    """
    RunPod Serverless Client adapter.
    Handles job dispatch, polling, timeout handling, and local mock fallback.
    """

    def __init__(self):
        self.api_key = settings.RUNPOD_API_KEY
        self.timeout = settings.RUNPOD_TIMEOUT_SECONDS
        self.poll_interval = settings.RUNPOD_POLL_INTERVAL_SECONDS
        self.mock_fallback = settings.RUNPOD_MOCK_FALLBACK

    def is_configured(self, endpoint_id: Optional[str] = None) -> bool:
        ep = endpoint_id or settings.RUNPOD_FLUX_ENDPOINT_ID
        return bool(self.api_key and ep)

    async def execute_job(
        self,
        endpoint_id: str,
        input_payload: Dict[str, Any],
        synchronous: bool = True,
    ) -> Dict[str, Any]:
        """Dispatches an inference job to RunPod serverless worker."""
        if not self.is_configured(endpoint_id):
            if self.mock_fallback:
                logger.info("RunPod endpoint not configured. Using local fallback simulation.")
                return {"status": "MOCK_FALLBACK", "message": "RunPod endpoint not configured, falling back to local simulation"}
            raise RuntimeError("RunPod API key or Endpoint ID is not configured in settings.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Synchronous execution
        if synchronous:
            url = f"https://api.runpod.ai/v2/{endpoint_id}/runsync"
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                try:
                    response = await client.post(url, headers=headers, json={"input": input_payload})
                    response.raise_for_status()
                    data = response.json()
                    return data
                except Exception as ex:
                    logger.warning(f"RunPod runsync failed: {ex}. Checking fallback.")
                    if self.mock_fallback:
                        return {"status": "MOCK_FALLBACK", "error": str(ex)}
                    raise

        # Asynchronous execution with polling
        run_url = f"https://api.runpod.ai/v2/{endpoint_id}/run"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(run_url, headers=headers, json={"input": input_payload})
            resp.raise_for_status()
            job_data = resp.json()
            job_id = job_data.get("id")

        if not job_id:
            raise RuntimeError("RunPod did not return a job ID.")

        # Poll for completion
        status_url = f"https://api.runpod.ai/v2/{endpoint_id}/status/{job_id}"
        elapsed = 0.0
        async with httpx.AsyncClient(timeout=30.0) as client:
            while elapsed < self.timeout:
                await asyncio.sleep(self.poll_interval)
                elapsed += self.poll_interval
                check_resp = await client.get(status_url, headers=headers)
                check_data = check_resp.json()
                status = check_data.get("status")

                if status == "COMPLETED":
                    return check_data
                elif status in ["FAILED", "CANCELLED", "TIMED_OUT"]:
                    raise RuntimeError(f"RunPod job terminated with status {status}: {check_data.get('error')}")

        raise TimeoutError(f"RunPod job {job_id} timed out after {self.timeout} seconds.")


runpod_client = RunPodClient()
