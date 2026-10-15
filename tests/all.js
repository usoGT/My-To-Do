// Tüm test dosyaları burada içe aktarılır. Yeni test dosyası eklenince bu listeye ekle.
import { run } from './runner.js';
import './dom.test.js';
import './dates.test.js';
import './text.test.js';
import './store.test.js';
import './settings.test.js';
import './backup.test.js';
import './courses.test.js';
import './time-slots.test.js';
import './tasks.test.js';
import './routines.test.js';
import './agenda.test.js';
import './goals.test.js';
import './course-notes.test.js';
import './course-overview.test.js';
import './timer.test.js';
import './task-parser.test.js';
import './quick-notes.test.js';
import './deadlines.test.js';
import './exams.test.js';
import './report.test.js';
import './sync.test.js';

run(document.getElementById('out'));
