import asyncio
import base64
import logging
from typing import Dict, Any, Optional
import httpx
from ..core.config import settings

logger = logging.getLogger(__name__)


class BFLClient:
    """
    Black Forest Labs (BFL) FLUX API Client (api.bfl.ai / api.bfl.ml).
    Supports official FLUX 2 Klein, FLUX.1 Pro, and Inpainting/Fill endpoints.
    """

    def __init__(self):
        self.api_key = settings.BFL_API_KEY
        self.base_url = settings.BFL_BASE_URL.rstrip("/")
        self.flux_model = settings.BFL_FLUX_MODEL
        self.inpainting_model = settings.BFL_INPAINTING_MODEL
        self.poll_interval = settings.BFL_POLL_INTERVAL_SECONDS
        self.timeout = settings.BFL_TIMEOUT_SECONDS

    def is_configured(self) -> bool:
        """Returns True if the user has provided a valid BFL API key in .env."""
        return bool(self.api_key and self.api_key.strip())

    @staticmethod
    def _safe_json(resp: httpx.Response) -> Dict[str, Any]:
        """Safely parses JSON responses, avoiding bare JSONDecodeError on HTML error pages."""
        try:
            return resp.json()
        except ValueError:
            raise RuntimeError(f"BFL Non-JSON response (HTTP {resp.status_code}): {resp.text[:250]}")

    async def _poll_task(self, polling_url: str) -> Dict[str, Any]:
        """Polls BFL polling_url endpoint until job status is 'Ready' or terminal."""
        headers = {
            "accept": "application/json",
            "x-key": self.api_key,
        }
        elapsed = 0.0

        async with httpx.AsyncClient(timeout=30.0) as client:
            while elapsed < self.timeout:
                await asyncio.sleep(self.poll_interval)
                elapsed += self.poll_interval

                try:
                    resp = await client.get(polling_url, headers=headers)
                    if resp.status_code == 200:
                        data = self._safe_json(resp)
                        status = data.get("status")

                        if status == "Ready":
                            return data
                        elif status in ["Error", "Task not found", "Request Moderated", "Failed"]:
                            err_msg = data.get("error") or data.get("details") or status
                            raise RuntimeError(f"BFL job failed with status '{status}': {err_msg}")
                        # Status is "Pending" or "Processing" - continue polling
                    else:
                        logger.warning(f"BFL polling response status: {resp.status_code} ({resp.text[:150]})")
                except httpx.RequestError as ex:
                    logger.warning(f"BFL polling network warning: {ex}")

        raise TimeoutError(f"BFL FLUX job timed out after {self.timeout} seconds ({polling_url}).")

    async def _fetch_image_as_base64(self, image_url: str) -> str:
        """Downloads the rendered image from BFL CDN and converts to Base64."""
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.get(image_url)
            resp.raise_for_status()
            return base64.b64encode(resp.content).decode("utf-8")

    async def generate_image(
        self,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
        model: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Dispatches Text-to-Image synthesis to BFL FLUX."""
        if not self.is_configured():
            raise RuntimeError("BFL_API_KEY is not configured in .env.")

        models_to_try = [model] if model else [self.flux_model, "flux-pro-1.1", "flux-dev"]
        last_error = None

        headers = {
            "accept": "application/json",
            "x-key": self.api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "prompt": prompt,
            "width": width,
            "height": height,
            "prompt_upsampling": False,
            "safety_tolerance": 2,
            "output_format": "jpeg",
        }
        if seed is not None:
            payload["seed"] = seed

        async with httpx.AsyncClient(timeout=35.0) as client:
            for target_model in models_to_try:
                endpoint_url = f"{self.base_url}/{target_model}"
                try:
                    resp = await client.post(endpoint_url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        init_data = self._safe_json(resp)
                        task_id = init_data.get("id")
                        polling_url = init_data.get("polling_url") or f"{self.base_url}/get_result?id={task_id}"

                        logger.info(f"Dispatched BFL FLUX job {task_id} on model '{target_model}'. Polling {polling_url}...")
                        result_data = await self._poll_task(polling_url)
                        sample_url = result_data.get("result", {}).get("sample")
                        if not sample_url:
                            raise RuntimeError(f"BFL completed without sample URL: {result_data}")

                        image_b64 = await self._fetch_image_as_base64(sample_url)
                        return {
                            "task_id": task_id,
                            "image_url": sample_url,
                            "image_base64": image_b64,
                            "model_used": target_model,
                        }
                    else:
                        last_error = f"BFL API error on {target_model} (HTTP {resp.status_code}): {resp.text[:200]}"
                        logger.warning(last_error)
                except Exception as ex:
                    last_error = str(ex)
                    logger.warning(f"Error attempting BFL model {target_model}: {ex}")

        raise RuntimeError(f"All BFL model attempts failed. Last error: {last_error}")

    async def inpaint_image(
        self,
        image_base64: str,
        mask_base64: str,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
        model: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches Inpainting (Option A & Hybrid Production Pipeline) to BFL FLUX.
        Preserves 100% exact original gemstone pixels under the mask while generating
        the setting, prongs, and shank outward.
        """
        if not self.is_configured():
            raise RuntimeError("BFL_API_KEY is not configured in .env.")

        target_model = model or self.inpainting_model
        endpoint_url = f"{self.base_url}/{target_model}"
        headers = {
            "accept": "application/json",
            "x-key": self.api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "image": image_base64,
            "mask": mask_base64,
            "prompt": prompt,
            "width": width,
            "height": height,
            "prompt_upsampling": False,
            "safety_tolerance": 2,
            "output_format": "jpeg",
        }
        if seed is not None:
            payload["seed"] = seed

        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(endpoint_url, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"BFL Inpainting error ({resp.status_code}): {resp.text[:250]}")
            init_data = self._safe_json(resp)
            task_id = init_data.get("id")
            polling_url = init_data.get("polling_url") or f"{self.base_url}/get_result?id={task_id}"

        logger.info(f"Dispatched BFL Inpainting job {task_id} on model {target_model}. Polling {polling_url}...")
        result_data = await self._poll_task(polling_url)
        sample_url = result_data.get("result", {}).get("sample")
        if not sample_url:
            raise RuntimeError(f"BFL inpainting completed without sample URL: {result_data}")

        image_b64 = await self._fetch_image_as_base64(sample_url)
        return {
            "task_id": task_id,
            "image_url": sample_url,
            "image_base64": image_b64,
            "model_used": target_model,
        }


bfl_client = BFLClient()
