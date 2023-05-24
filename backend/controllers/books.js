
const sharp = require('sharp')
const Book = require('../models/Book');
const fs = require('fs');

// exports.createBook = (req, res, next) => {
//   delete req.body._id;
//   const book = new Book({
//     ...req.body
//   });
//   book.save()
//     .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
//     .catch(error => res.status(400).json({ error }));
// }

//Nouvelle syntaxe de la méthode createBook incluant la logique métier des fichiers entrants
exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book)

    delete bookObject;
    const book = new Book({
        ...bookObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        
    });

    sharp(req.file.path).resize(700,600)
    .toFile(`images/redim_${req.file.filename}` , (err) => {
        if (err){
            return res.status(422).json({error : err.message})
        }
        
        fs.unlink(req.file.path, (err) => {
            if(err){
                return res.status(400).json({error : err.message})
            }
            book.imageUrl = `${req.protocol}://${req.get("host")}/images/redim_${req.file.filename}`
            book.save()
            .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
            .catch((error)  => {
                fs.unlink(`images/redim_${req.file.filename}`, (err) => {
                    if(err){
                        console.error(err)
                    }
                })
                res.status(400).json({error: error});
            });
        })
    })
}


// exports.updateBook = (req, res, next) => {
//   Book.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
//     .then(() => res.status(200).json({ message: 'Objet modifié !'}))
//     .catch(error => res.status(400).json({ error }));
// }

//Nouvelle syntaxe de la méthode createBook incluant la logique métier des fichiers entrants
exports.updateBook = (req, res, next) => {
    //console.log(req.file.path)
    const bookObject = req.file ?
    {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/redim_${req.file.filename}`
    } : { ...req.body }
    if(req.file){
        console.log(req.params.id)
        Book.findOne({ _id: req.params.id }).then((book) =>{
            console.log(book)
            let filename = book.imageUrl.split('/images/')[1]
            filename = `images/${filename}`
            console.log(book.imageUrl)
            console.log(filename)
            fs.unlink( filename, (err) => {
                if(err){
                    return res.status(400).json({message: "ça veux pas"})
                }
            })
            sharp(req.file.path).resize(700,600)
            .toFile(`images/redim_${req.file.filename}`, (err) => {
                if(err){
                    return res.status(400).json({error : err.message})
                }
                fs.unlink(req.file.path, (err) => {
                    console.log(req.file.path)
                    if(err){
                        return res.status(400).json({error: err.message})
                    }
                    bookObject.imageUrl = `${req.protocol}://${req.get("host")}/images/redim_${req.file.filename}` 
                })
            })
        });
    }
    Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet modifié !'}))
    .catch(error => res.status(400).json({ error }));
    }


// exports.deleteBook = (req, res, next) => {
//   Book.deleteOne({ _id: req.params.id })
//     .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
//     .catch(error => res.status(400).json({ error }));
// }

//Nouvelle syntaxe de la méthode deleteBook incluant la solution à la faille de sécurité
// exports.deleteBook = (req, res, next) => {
//     Book.findOne({ _id: req.params.id })
//     .then((book) => { 
//         if (!book) {
//             return res.status(404).json({ error: new Error('Objet non trouvé !')})
//         }
//         if (book.userId !== req.auth.userId) {
//             return res.status(401).json({ error: new Error('Requête non authorisée !')})
//         }
//         Book.deleteOne({ _id: req.params.id })
//         .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
//         .catch(error => res.status(400).json({ error }));
//     })
// }

//Nouvelle syntaxe de la méthode createBook incluant la logique métier des fichiers entrants
exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then(book => {
        const filename = book.imageUrl.split('/images/')[1]
        fs.unlink(`images/${filename}`, () => {
            Book.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
            .catch(error => res.status(400).json({ error }));
        })
    })
    .catch(error => res.status(500).json({ error }))
}


exports.getBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
}

exports.getAllBooks = (req, res, next) => {
    Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
    }

exports.getRatingBook = async (req, res, next) => {  
    await Book.find().sort({ averageRating : -1 /*"desc*/}).limit(3)
    .then(book => res.status(200).json(book))
    .catch(error => res.status(400).json({ error }));
}

exports.ratingBook = (async(req, res, next) => {
   
    const bookId  = req.params.id;
    const ratings = { userId: req.body.userId, grade: req.body.rating };
    const initialValue = 0;
    
    
    const book = await Book.findById(bookId);
    
     const found = book.ratings.find((element) => element.userId === req.auth.userId);
     console.log(found);
        
    if(!found){
        const notations = book.ratings.map((rating) => rating.grade);
        let averageRating = Math.round(
        (notations.reduce((accumulator, currentValue) => accumulator + currentValue, initialValue) + ratings.grade) /
        (notations.length + 1));
        const newData = await Book.findOneAndUpdate(
            { _id: bookId },
            { $push: { ratings }, averageRating},
            {new:true});
        res.status(200).json(newData);
            }

        else{
            console.log(found)
            res.status(401).json({message :"error"}); 
            } 
   });
   
  
