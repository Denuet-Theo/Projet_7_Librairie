const express = require('express')
const booksCtrl = require('../controllers/books')

//Ligne de code permettant d'importer le middleware d'authentification
const auth = require('../middleware/auth')

//Ligne de code permettant d'importer le middleware multer
const multer = require('../middleware/multer-config')

//Ligne de code permettant de créer le routeur
const router = express.Router()

router.get('/', booksCtrl.getAllBooks);
router.post('/', auth, multer, booksCtrl.createBook);
router.get('/bestrating', booksCtrl.getRatingBook);
router.put('/:id', auth, multer, booksCtrl.updateBook);
router.delete('/:id', auth, multer, booksCtrl.deleteBook);
router.get('/:id', booksCtrl.getBook);
router.post('/:id/rating',auth, booksCtrl.ratingBook);

//A importer dans la variable booksRoutes du fichier app.js
module.exports = router


