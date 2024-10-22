class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors
        
        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}

/* how use : -

import { ApiError } from './path-to-api-error';

// A sample Express route
app.get('/users/:id', async (req, res, next) => {
    try {
        const user = await getUserById(req.params.id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        res.json(user);
    } catch (err) {
        next(err);  // Pass the error to Express's error handling middleware
    }
}); 

*/