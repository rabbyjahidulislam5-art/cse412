import { Router } from 'express';
import { LibraryController } from '../controllers/library.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { issueBookSchema, returnBookSchema, bookSchema } from '../dtos';

const router = Router();
const controller = new LibraryController();

router.get('/dashboard', authenticate, requireRole('LIBRARY_STAFF'), controller.getDashboard.bind(controller));
router.get('/books', authenticate, requireRole('LIBRARY_STAFF'), controller.getBooks.bind(controller));
router.post('/books', authenticate, requireRole('LIBRARY_STAFF'), validate(bookSchema), controller.addBook.bind(controller));
router.get('/books/:isbn', authenticate, requireRole('LIBRARY_STAFF'), controller.getBook.bind(controller));
router.post('/issue', authenticate, requireRole('LIBRARY_STAFF'), validate(issueBookSchema), controller.issueBook.bind(controller));
router.post('/return', authenticate, requireRole('LIBRARY_STAFF'), validate(returnBookSchema), controller.returnBook.bind(controller));
router.get('/overdue', authenticate, requireRole('LIBRARY_STAFF'), controller.getOverdue.bind(controller));
router.post('/overdue/:id/remind', authenticate, requireRole('LIBRARY_STAFF'), controller.sendOverdueReminder.bind(controller));
router.get('/fines', authenticate, requireRole('LIBRARY_STAFF'), controller.getFines.bind(controller));
router.get('/students', authenticate, requireRole('LIBRARY_STAFF'), controller.searchStudents.bind(controller));
router.get('/reports', authenticate, requireRole('LIBRARY_STAFF'), controller.getReports.bind(controller));

export default router;
