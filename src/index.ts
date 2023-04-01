import './config'; // Load environment variables
import 'express-async-errors'; // Enable default error handling for async errors
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import express, { Express } from 'express';
import UserController from './controllers/UserController';
import LinkController from './controllers/LinkController';

const app: Express = express();
app.use(express.json());
const { PORT, COOKIE_SECRET } = process.env;

const SQLiteStore = connectSqlite3(session);

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite' }),
    secret: COOKIE_SECRET as string,
    cookie: { maxAge: 8 * 60 * 60 * 1000 },
    name: 'session',
    resave: false,
    saveUninitialized: false,
  })
);

app.post('/api/users', UserController.registerUser);
app.post('/api/login', UserController.logIn);
app.post('/api/links', LinkController.shortenUrl);

app.get('/:targetLinkId', LinkController.getOriginalUrl);
app.get('/api/users/:userId/links', LinkController.getLinksByUser);

app.delete('/api/users/:userId/links/:linkId', LinkController.deleteLink);

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
