const {body,validationResult}=require('express-validator');

 const respondWithValidationErrors=(req,res,next)=>{
    const errors=validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};


const registerValidations=[
    body("name")
    .isString()
    .withMessage("name must be a string")
    .notEmpty()
    .withMessage("name is required"),
    body("password")
    .isString()
    .withMessage("password must be a string")
    .notEmpty()
    .withMessage("password is required"),
    body("email")
    .isEmail()
    .withMessage("email must be a valid email")
    .notEmpty()
    .withMessage("email is required"),
    respondWithValidationErrors

];

const loginValidations = [
    // Custom validator to ensure either email or username is present
    body().custom(body => {
        if (!body.email && !body.username) {
            throw new Error('Either email or username is required');
        }
        return true;
    }),
    body('email')
        .optional()
        .isEmail()
        .withMessage('email must be a valid email'),
    body('username')
        .optional()
        .isString()
        .withMessage('username must be a string'),
    body('password')
        .isString()
        .withMessage('password must be a string')
        .isLength({ min: 4 })
        .withMessage('password must be at least 6 characters long'),
    respondWithValidationErrors
];

module.exports={
    registerValidations,
    loginValidations
}