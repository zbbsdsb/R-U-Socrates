from typing import Tuple

from config import Config
from .element import DataElement
from .mongo_database import create_client


# Create database instance
db = create_client()


async def program_sample() -> Tuple[str, int]:
    """
    Sample program using UCT algorithm and generate context.
    
    Process:
    1. Use UCT algorithm to select a node as parent node
    2. Get top 2 best results
    3. Get 2-50 random results
    4. Concatenate results into context
    5. The modified file is the program of the node selected by UCT
    
    Returns:
        Tuple containing context string and parent index
    """
    context = ""

    # Get parent element using UCT sampling
    parent_element = db.candidate_sample_from_range(1, 10, 1)[0]
    ref_elements = db.candidate_sample_from_range(11, 50, 4)

    # Build context from parent and reference elements
    context += await parent_element.get_context()
    for element in ref_elements:
        context += await element.get_context()

    parent = parent_element.index
    
    # Write the program of the UCT selected node
    # If no node is selected, use the best result
    with open(Config.SOURCE_FILE, 'w', encoding='utf-8') as f:
        f.write(parent_element.program)
        print(f"[DATABASE] Implement Changes selected node (index: {parent})")
    
    return context, parent


def update(result: DataElement) -> bool:
    """
    Update database with new experimental result.
    
    Args:
        result: DataElement containing experimental results
        
    Returns:
        True if update successful
    """
    db.add_element_from_dict(result.to_dict())
    return True