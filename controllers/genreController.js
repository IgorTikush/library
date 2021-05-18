var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body,validationResult } = require("express-validator");

exports.genre_list = function(req, res, next) {

    Genre.find()
      .sort([['name', 'ascending']])
      .exec(function (err, list_genres) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
      });
  
  };

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    console.log(req.params.id)
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', { title: 'Create Genre' });
  };

// Handle Genre create on POST.
exports.genre_create_post =  [

    // Validate and santize the name field.
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a genre object with escaped and trimmed data.
      var genre = new Genre(
        { name: req.body.name }
      );
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
        return;
      }
      else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ 'name': req.body.name })
          .exec( function(err, found_genre) {
             if (err) { return next(err); }
  
             if (found_genre) {
               // Genre exists, redirect to its detail page.
               res.redirect(found_genre.url);
             }
             else {
  
               genre.save(function (err) {
                 if (err) { return next(err); }
                 // Genre saved. Redirect to genre detail page.
                 res.redirect(genre.url);
               });
  
             }
  
           });
      }
    }
  ];

// Display Genre delete form on GET.
// exports.genre_delete_get = function(req, res) {
//     res.send('NOT IMPLEMENTED: Genre delete GET');
// };

exports.genre_delete_get = function(req, res) {
    
  async.parallel({
      genre: function(callback) {
          Genre.findById(req.params.id).exec(callback)
          
      }, 
      books: function(callback) {
          Book.find({ 'genre': req.params.id }).exec(callback)
          
      },
  }, function(err, results) {
      if (err) { return next(err)}
      if (results.books == null) {
          res.redirect('catalog/genres')
      }
      
      res.render('genre_delete', {title: 'Delete Book', genre: results.genre, books: results.books})
  })
};


// Handle Genre delete on POST.
// Handle book delete on POST.
exports.genre_delete_post = function(req, res, next) {
  async.parallel({
      genre: function(callback) {
          Genre.findById(req.params.id).exec(callback)
          
      }, 
      books: function(callback) {
          Book.find({ 'genre': req.params.id }).exec(callback)
          
      },
  }, function(err, results) {
      if (err) { return next(err)}
      if (results.books.length > 0) {
          res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, books: results.books})
          return;
      } else {
          Genre.findByIdAndDelete(req.body.genreid, function deleteGenre(err) {
              if (err) { return next(err);}
              res.redirect('/catalog/genres')
          })
      }
      
      
  })
};


// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {

  // Get book, genres and genres for form.
  async.parallel({
      genre: function(callback) {
          Genre.findById(req.params.id).exec(callback);
      },
      }, function(err, results) {
          if (err) { return next(err); }
          if (results.genre==null) { // No results.
              var err = new Error('genre not found');
              err.status = 404;
              return next(err);
          }
          // Success.
          // Mark our selected genres as checked.
          console.log(results.genre.name)
          res.render('genre_form', { title: 'Update genre', genre: results.genre });
      });

};

// Handle Genre update on POST.


// Handle book update on POST.
exports.genre_update_post = [

  // Validate and sanitise fields.
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a Book object with escaped/trimmed data and old id.
      var genre = new Genre(
        { name: req.body.name,
          _id:req.params.id //This is required, or a new ID will be assigned!
         });

      if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.

          // Get all genres and genres for form.
          async.parallel( function(err, results) {
              if (err) { return next(err); }
              
              res.render('genre_form', { title: 'Update genre', genre: genre, errors: errors.array() });
          });
          return;
      }
      else {
          // Data from form is valid. Update the record.
          Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,thegenre) {
              if (err) { return next(err); }
                 // Successful - redirect to book detail page.
                 res.redirect(thegenre.url);
              });
      }
  }
];