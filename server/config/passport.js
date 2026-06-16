const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    user = await User.findOne({ email: profile.emails[0].value });
                    if (user) {
                        user.googleId = profile.id;
                        if (!user.avatar) user.avatar = profile.photos[0]?.value ?? null;
                        await user.save();
                    } else {
                        const base = profile.displayName?.replace(/\s+/g, '').toLowerCase() || 'user';
                        let username = base;
                        let i = 1;
                        while (await User.findOne({ username })) {
                            username = `${base}${i++}`;
                        }
                        user = await User.create({
                            username,
                            email: profile.emails[0].value,
                            googleId: profile.id,
                            avatar: profile.photos[0]?.value ?? null,
                        });
                    }
                }

                done(null, user);
            } catch (err) {
                done(err);
            }
        },
    ),
);

module.exports = passport;
