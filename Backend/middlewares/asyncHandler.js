export const asyncHandler = (thefunction) => (req, res, next) => 
{
    Promise.resolve(thefunction(req, res, next)).catch(next);
};