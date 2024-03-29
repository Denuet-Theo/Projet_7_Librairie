const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.TOKEN_CHAINE);
        const userId = decodedToken.userId;
        req.auth = { userId }; //Raccourci JS pour attribuer la valeur d'une variable à une clé du même nom
        if (req.body.userId && req.body.userId !== userId) {
        throw 'Invalid user ID';
        } else {
            next();
        }
    } catch {
        res.status(401).json({
        error: new Error('Invalid request!')
        });
    }
};