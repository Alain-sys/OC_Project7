function validateCreatedBook(book) {
  if (!book.title || !book.author || !book.year || !book.genre || !book.imageUrl || !book.averageRating || !book.ratings) {
    throw new Error('Missing required fields');
  }

  if (book.averageRating < 0 || book.averageRating > 5) {
    throw new Error('Average rating must be between 0 and 5');
  }
}

function validateUpdatedBook(book) {
  if (!book.title || !book.author || !book.year || !book.genre) {
    throw new Error('Missing required fields');
  }
}

module.exports = {
  validateCreatedBook,
  validateUpdatedBook,
}