"""
End-to-End Generative Jewelry Design & Dynamic Valuation Pipeline
-----------------------------------------------------------------
Executes the unified production workflow:
1. User JSON Specification
       │
       ├──► Prompt Synthesizer ──► Model 1 (FLUX.2 Generative Diffusion)
       │                                     │
       ▼                                     ▼
2. Gemini Vision Visual Feature Auditor (audits setting, accents, complexity, metal tone)
       │
       ▼
3. Parametric Bill of Materials (BOM) & Quantile Pricing Engine (LKR)
       │
       ▼
4. Final Client Output:
   - High-Res Design Render
   - Audited Physical Specifications
   - Itemized Bill of Materials (BOM)
   - Calibrated Commercial Quotation: P10 (Wholesale) / P50 (Fair Market) / P90 (Showroom Boutique)
"""

import os
import sys
import json
from typing import Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.common.prompt_builder import build_diffusion_prompt
from src.common.config import get_base_dir
from src.model2_cost.gemini_vision_bridge import vision_inspector
from src.model2_cost.bom_pricer import bom_pricer


class JewelryDesignAndCostSystem:
    def __init__(self):
        self.base_dir = get_base_dir()
        self.vision_inspector = vision_inspector
        self.pricer = bom_pricer

    def process_order(self, user_input: Dict[str, Any], rendered_image_path: str = "") -> Dict[str, Any]:
        """
        Executes end-to-end processing for a jewelry custom design order.
        """
        # 1. Synthesize Studio Conditioning Prompts for Model 1
        narrative_prompt, tag_prompt = build_diffusion_prompt(user_input)

        # 2. Visual Feature Inspection via Gemini Vision Bridge
        # Extracts discrete attributes (setting, accents, complexity, metal tone) from rendered image
        visual_audit = self.vision_inspector.inspect_image(
            image_path=rendered_image_path,
            user_specs=user_input
        )

        # 3. Reconcile user specifications with audited visual features
        reconciled_specs = {
            **user_input,
            "setting_type": visual_audit.get("setting_type", user_input.get("setting_type", "Prong")),
            "number_of_accent_stones": visual_audit.get("number_of_accent_stones", user_input.get("number_of_accent_stones", 0)),
            "design_complexity": visual_audit.get("design_complexity", user_input.get("design_complexity", "Simple")),
            "metal_tone": visual_audit.get("metal_tone", "Yellow")
        }

        # 4. Predict calibrated pricing intervals (P10 / P50 / P90) and itemized BOM
        quote = self.pricer.predict_price_range(reconciled_specs)

        return {
            "status": "success",
            "model1_diffusion": {
                "narrative_prompt": narrative_prompt,
                "tag_prompt": tag_prompt,
                "image_rendered": rendered_image_path if os.path.exists(rendered_image_path) else "simulated_macro_preview"
            },
            "visual_inspection_audit": visual_audit,
            "reconciled_specifications": {
                "category": reconciled_specs.get("category", "Ring"),
                "gemstone": f"{reconciled_specs.get('gemstone', 'Blue Sapphire')} ({reconciled_specs.get('gemstone_weight_ct', 1.5)} ct)",
                "metal": f"{reconciled_specs.get('metal', '22KT Gold')} ({reconciled_specs.get('metal_weight_g', 4.5)} g)",
                "setting_type": reconciled_specs["setting_type"],
                "accent_stones_count": reconciled_specs["number_of_accent_stones"],
                "design_complexity": reconciled_specs["design_complexity"]
            },
            "commercial_valuation_lkr": {
                "currency": "LKR",
                "p10_wholesale_floor": quote["p10_wholesale_floor_lkr"],
                "p50_fair_market_price": quote["p50_fair_market_price_lkr"],
                "p90_showroom_retail_ceiling": quote["p90_showroom_ceiling_lkr"],
                "itemized_bom": quote["bom_breakdown"]
            }
        }


if __name__ == "__main__":
    system = JewelryDesignAndCostSystem()
    sample_order = {
        "category": "Ring",
        "gemstone": "Blue Sapphire",
        "gemstone_weight_ct": 2.50,
        "gemstone_cut": "cushion cut",
        "gemstone_quality": "AAA",
        "color_grade": "Royal Blue",
        "treatment": "Unheated",
        "stone_grade": "AAA (Extra Fine)",
        "metal": "22KT Gold",
        "metal_weight_g": 5.20,
        "setting_type": "Halo",
        "design_complexity": "Complex",
        "number_of_accent_stones": 16
    }
    result = system.process_order(sample_order)
    print("\n--- END-TO-END PIPELINE RESULT ---")
    print(json.dumps(result, indent=2))
