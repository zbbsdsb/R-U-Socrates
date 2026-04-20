from dataclasses import dataclass, asdict
from typing import Dict, Optional

from utils.agent_logger import log_agent_run
from .model import summarizer
from .prompt import Summary_input


@dataclass
class DataElement:
    """Data element model for experimental results."""
    time: str
    name: str
    result: Dict[str, str]
    program: str
    motivation: str
    analysis: str
    cognition: str
    log: str
    parent: Optional[int] = None
    index: Optional[int] = None
    summary: Optional[str] = None
    
    def to_dict(self) -> Dict:
        """Convert DataElement instance to dictionary."""
        return asdict(self)
    
    async def get_context(self) -> str:
        """Generate enhanced context with structured experimental evidence presentation."""
        summary = await log_agent_run(
            "summarizer",
            summarizer,
            Summary_input(self.motivation, self.analysis, self.cognition)
        )
        summary_result = summary.final_output.experience

        return f"""## EXPERIMENTAL EVIDENCE PORTFOLIO

### Experiment: {self.name}
**Architecture Identifier**: {self.name}

#### Performance Metrics Summary
**Training Progression**: {self.result["train"]}
**Evaluation Results**: {self.result["test"]}

#### Implementation Analysis
```python
{self.program}
```

#### Synthesized Experimental Insights
{summary_result}

---"""

    @classmethod
    def from_dict(cls, data: Dict) -> 'DataElement':
        """Create DataElement instance from dictionary."""
        return cls(**data)