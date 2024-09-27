import express, { Application, json, static as static_ } from "express";
import passport from "passport";
import path from 'path';
import httpContext from 'express-http-context';
import { config } from "dotenv";
import { Strategy as instagtamStrategy } from "passport-instagram";
import axios from "axios";

config();
const app: Application = express();

const PORT = 4000;
app.use(json());
app.use(static_(path.join(__dirname, '../public')));
app.use(httpContext.middleware);
app.use(passport.initialize());

// FLOW ONE (1)
function OAUTH_Authorize(app_id: string, redirect_uri: string, responseType: string = 'code', scope: string) {
    return axios.get(`https://api.instagram.com/oauth/authorize`, {
        params: {
            client_id: app_id,
            redirect_uri: redirect_uri || 'http://localhost:4000/auth/instagram/callback',
            scope: scope,
            response_type: responseType
        }
    })

}

OAUTH_Authorize(process.env.INSTAGRAM_CLIENT_ID as string, 'http://localhost:4000/auth/instagram/callback', 'code', 'user_profile, user_media').then((data) => {
    console.log(data);
}).catch((error) => {
    console.log(error);
});

function OAUTH_ACCESS_TOKEN(client_id: string, client_secret: string, redirect_uri: string, code: string) {
    try {
        const response = axios.post("https://api.instagram.com/oauth/access_token", {
            client_id: client_id,
            client_secret,
            grant_type: 'authorization_code',
            redirect_uri: redirect_uri || 'http://localhost:4000/auth/instagram/callback',
            code: code
        })
    } catch (error) {
        console.log(error);
        throw error;
    }
}

passport.use(new instagtamStrategy({
    clientID: 'your_client_id',
    clientSecret: 'your_client_secret',
    callbackURL: 'http://localhost:4000/auth/instagram/callback',
}, function (accessToken, refreshToken, profile, done) {
    return done(null, { profile, accessToken })
}));

app.get('/auth/instagram', passport.authenticate('instagram'));

app.get('/auth/instagram/callback',
    passport.authenticate('instagram', { failureRedirect: '/' }),
    (req: any, res) => {
        res.redirect(`/profile?username=${req.user.profile.username}`);
    }
);

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`server started and running on port ${PORT}`);
});