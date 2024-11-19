module.exports = function(app, passport, db) {

  const TestResult = require('./models/testResult');

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) { // This is the router 
        db.collection('messages').find().toArray((err, result) => { // This is the controller - "If the get /profile hears a request go talk to this controller"
          if (err) return console.log(err)
          res.render('profile.ejs', { // Pass into to the profile.ejs. This sets the header to HTML
            user : req.user, // pass eveyrthing about the user here off of the req object. Automatically passed through with each request; can console.log to see
            messages: result // passing this into the ejs
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout(() => {
          console.log('User has logged out!')
        });
        res.redirect('/');
    });

// test routes ===============================================================



// test page
app.get('/test', isLoggedIn, (req, res) => {
    res.render('test');
});

// submit test answers get the calculate score
app.post('/submitTest', isLoggedIn, async (req, res) => {
    const answers = req.body.answers; 
    const score = calculateScore(answers); // getting the score
    
    try {
        const newTestResult = new TestResult({
            userId: req.user._id,
            score: score,
            answers: answers
        });
        await newTestResult.save();
        
        res.redirect('/profile'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving test result');
    }
});

// redoing the test
app.put('/redoTest', isLoggedIn, async (req, res) => {
    const answers = req.body.answers; 
    const score = calculateScore(answers);
    
    try {
        const result = await TestResult.findOneAndUpdate(
            { userId: req.user._id },
            { score: score, answers: answers },
            { new: true }
        );
        
        res.redirect('/profile'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating test result');
    }
});

// delete the test result
app.delete('/deleteTest', isLoggedIn, async (req, res) => {
    try {
        await TestResult.deleteOne({ userId: req.user._id });
        res.redirect('/profile'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting test result');
    }
});

// calculating score based on answers
function calculateScore(answers) {
    const correctAnswers = ['A', 'C', 'B', 'D', 'A', 'B', 'C', 'A', 'D', 'B'];
    let score = 0;
    for (let i = 0; i < answers.length; i++) {
        if (answers[i] === correctAnswers[i]) {
            score++;
        }
    }
    return score;
}



// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') }); // Find out what flash method is
        }); // User sees the response

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', { // looks in passport file , uses the user model on line 7, then look in user.js file (hash is here, you never want to store passwords in plain text. You always ant to hash it)
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages. Show the user why they failed
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) { 
    if (req.isAuthenticated()) // If authenticated return it
        return next(); // Function built into express

    res.redirect('/'); // If not redirect the user to the homepage
}
