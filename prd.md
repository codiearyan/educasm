Challenges

3. Chat History (Explore Mode)
The current chat interface doesn’t store past conversations.
Implement a scrollable chat history (similar to Perplexity.ai).
Ensure it doesn’t break the existing auto-scroll feature.
4. Context for Follow-Up Questions
The follow-up question bar doesn’t retain context.
Ensure each follow-up question has access to the previous chat’s context.

6. Rate Limiting
Add rate limits to prevent abuse:
15 requests/min, 250/hour, 500/day per user session.
7. Duolingo-Inspired Feature
Spend 10 minutes on the Duolingo app.
Identify a feature that can be integrated into Playground mode.
Implement a basic version of it (no need to be polished).
8. Bonus Points if you can Implement this Logic in Playground 
Every time a user solves one problem - keping the context of the time taken to attempt, and if its correct/incorrect and based on these 2 parameters gpt should give the next question - eg: a user solves a problem in 5 seconds and is correct next question should be difficult, a user takes 30 seconds and gets the answer incorrect - the next question should be easier.
