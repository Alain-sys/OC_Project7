const Book = require('../models/Book');
const fs = require('fs');
const { validateCreatedBook, validateUpdatedBook } = require('../utils/bookValidation');

exports.createBook = (req, res, next) => {
   try {
     const bookObject = JSON.parse(req.body.book);
     delete bookObject._id;

     const book = new Book({
       ...bookObject,
       userId: req.auth.userId,
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
     });

     validateCreatedBook(book);

     if (book.ratings && book.ratings.length > 1) {
       throw new Error('A book can only have one rating upon creation');
     }

     for (const rating of book.ratings) {
       if (rating.grade < 0 || rating.grade > 5) {
         throw new Error('Each rating grade must be between 0 and 5');
       }
     }

     book
       .save()
       .then(() => {
         res.status(201).json({ message: 'Saved Object !' });
       })
       .catch((error) => {
         res.status(400).json({ error });
       });

   } catch (error) {
     res.status(400).json({ error: error.message });
   }
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book) {
        res.status(200).json(book);
      } else {
        res.status(404).json({ error: 'Book not found' });
      }
    })
    .catch((error) => res.status(404).json(error));
};

exports.modifyBook = (req, res, next) => {
  try {
    const bookObject = req.file
      ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        }
      : { ...req.body };

    delete bookObject.user_Id;
    if (bookObject.ratings) {
      delete bookObject.ratings;
    }
    if(bookObject.averageRating){
      delete bookObject.averageRating;
    };
        
    validateUpdatedBook(bookObject); 

    Book.findOne({ _id: req.params.id })
      .then((book) => {
        if (book.userId != req.auth.userId) {
          res.status(401).json({ message: 'Not authorized' });
        }        
        Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Updated Object !' }))
          .catch((error) => res.status(401).json({ error }));
      })
      .catch((error) => {
        res.status(400).json({ error });
      });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Item deleted !' }))
            .catch((error) => res.status(400).json({ error }));
        });
      }
    })
    .catch((error) => res.status(401).json({ error }));
};


exports.getBestRatingBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};


exports.rateBook = (req, res, next) => {
  const updateRating = {
    userId: req.auth.userId,
    grade: req.body.rating
  }

  if (updateRating.grade < 0 || updateRating.grade > 5) {
    return res.status(400).json({ error: 'Rating must be between 0 and 5.' });
  }

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.ratings.find(ratings => ratings.userId === req.auth.userId)) {
                return res.status(400).json({ message: 'User already rated for this book' });
            } else {
                book.ratings.push(updateRating);
                book.averageRating = (book.averageRating * (book.ratings.length - 1) + updateRating.grade) / book.ratings.length;
                return book.save();
            }
        })
        .then((updateBook) => res.status(201).json(updateBook))
        .catch(error => res.status(400).json({ error }));
};