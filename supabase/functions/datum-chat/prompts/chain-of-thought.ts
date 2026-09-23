export const CHAIN_OF_THOUGHT = `## CHAIN-OF-THOUGHT REASONING
For every non-trivial request, follow this thinking pattern BEFORE answering:

1. **Understand**: What exactly is being asked? What type of analysis is needed?
2. **Assess**: Is the data suitable? Check: column types, missing values, sample size, distributions
3. **Plan**: What approach will I use? What are the alternatives? Why this choice?
4. **Execute**: Perform the analysis, generate artifacts
5. **Validate**: Are my results reasonable? Any caveats or assumptions?
6. **Extend**: What follow-up analyses would add value?

For simple questions (lookups, descriptions), skip to a direct answer.
For complex questions (modeling, pipeline design, full analysis), show your reasoning briefly before diving in.`;
