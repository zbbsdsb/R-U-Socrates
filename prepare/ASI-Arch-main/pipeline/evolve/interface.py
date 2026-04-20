from .prompt import Planner_input, Motivation_checker_input, Deduplication_input, CodeChecker_input
from .model import planner, motivation_checker, deduplication, code_checker
from agents import exceptions, set_tracing_disabled
from typing import List, Tuple
from config import Config
from database.mongo_database import create_client
from utils.agent_logger import log_agent_run

async def evolve(context: str) -> Tuple[str, str]:
    for attempt in range(Config.MAX_RETRY_ATTEMPTS):
        with open(Config.SOURCE_FILE, 'r') as f:
            original_source = f.read()
            
        name, motivation = await gen(context)
        
        if await check_code_correctness(motivation):
            return name, motivation

        with open(Config.SOURCE_FILE, 'w') as f:
            f.write(original_source)
        print("Try new motivations")
    return "Failed", "evolve error"
    
async def gen(context: str) -> Tuple[str, str]:
    # Save original file content
    with open(Config.SOURCE_FILE, 'r') as f:
        original_source = f.read()
        
    repeated_result = None
    motivation = None
    
    for attempt in range(Config.MAX_RETRY_ATTEMPTS):
        try:
            # Restore original file
            with open(Config.SOURCE_FILE, 'w') as f:
                f.write(original_source)
            
            # Use different prompt based on whether it's repeated
            plan = None
            if attempt == 0:
                input = Planner_input(context)
                plan = await log_agent_run("planner", planner, input)
            else:
                repeated_context = await get_repeated_context(repeated_result.repeated_index)
                input = Deduplication_input(context, repeated_context)
                plan = await log_agent_run("deduplication", deduplication, input)
                
            name, motivation = plan.final_output.name, plan.final_output.motivation
            
            repeated_result = await check_repeated_motivation(motivation)
            if repeated_result.is_repeated:
                print(f"Attempt {attempt + 1}: Motivation repeated, index is {repeated_result.repeated_index}")
                if attempt == Config.MAX_RETRY_ATTEMPTS - 1:
                    raise Exception("Maximum retry attempts reached, unable to generate non-repeated motivation")
                continue
            else:
                print(f"Attempt {attempt + 1}: Motivation not repeated, continue execution")
                print(motivation)
                return name, motivation
                
        except exceptions.MaxTurnsExceeded as e:
            print(f"Attempt {attempt + 1} exceeded maximum dialogue turns")
        except Exception as e:
            print(f"Attempt {attempt + 1} error: {e}")
            raise e

async def check_code_correctness(motivation) -> bool:
    """Check code correctness"""
    for attempt in range(Config.MAX_RETRY_ATTEMPTS):
        try:
            code_checker_result = await log_agent_run(
                "code_checker",
                code_checker,
                CodeChecker_input(motivation=motivation),
                max_turns=100
            )
            
            if code_checker_result.final_output.success:
                print("Code checker passed - code looks correct")
                return True
            else:
                error_msg = code_checker_result.final_output.error
                print(f"Code checker found issues: {error_msg}")
                if attempt == Config.MAX_RETRY_ATTEMPTS - 1:
                    print("Reaching checking limits")
                    return False
                continue
                
        except exceptions.MaxTurnsExceeded as e:
            print("Code checker exceeded maximum turns")
            return False
        except Exception as e:
            print(f"Code checker error: {e}")
            return False

async def check_repeated_motivation(motivation: str):
    client = create_client()
    similar_elements = client.search_similar_motivations(motivation)
    context = similar_motivation_context(similar_elements)
    input = Motivation_checker_input(context, motivation)
    repeated_result = await log_agent_run("motivation_checker", motivation_checker, input)
    return repeated_result.final_output


def similar_motivation_context(similar_elements: list) -> str:
    """
    Generate structured context from similar motivation elements
    """
    if not similar_elements:
        return "No previous motivations found for comparison."
    
    context = "### PREVIOUS RESEARCH MOTIVATIONS\n\n"
    
    for i, element in enumerate(similar_elements, 1):
        context += f"**Reference #{i} (Index: {element.index})**\n"
        context += f"```\n{element.motivation}\n```\n\n"
    
    context += f"**Total Previous Motivations**: {len(similar_elements)}\n"
    context += "**Analysis Scope**: Compare target motivation against each reference above\n"
    
    return context

def get_repeated_context(repeated_index: list[int]) -> str:
    """
    Generate structured context from repeated motivation experiments
    """
    client = create_client()
    repeated_elements = [client.get_elements_by_index(index) for index in repeated_index]
    
    if not repeated_elements:
        return "No repeated experimental context available."
    
    structured_context = "### REPEATED EXPERIMENTAL PATTERNS ANALYSIS\n\n"
    
    for i, element in enumerate(repeated_elements, 1):
        structured_context += f"**Experiment #{i} - Index {element.index}**\n"
        structured_context += f"```\n{element.motivation}\n```\n\n"
    
    structured_context += f"**Pattern Analysis Summary:**\n"
    structured_context += f"- **Total Repeated Experiments**: {len(repeated_elements)}\n"
    structured_context += f"- **Innovation Challenge**: Break free from these established pattern spaces\n"
    structured_context += f"- **Differentiation Requirement**: Implement orthogonal approaches that explore fundamentally different design principles\n\n"
    
    structured_context += f"**Key Insight**: The above experiments represent exhausted design spaces. Your task is to identify and implement approaches that operate on completely different mathematical, biological, or physical principles to achieve breakthrough innovation.\n"
    
    return structured_context