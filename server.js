let express = require('express');
let app = express();
let port = 3000;
let bodyParser = require('body-parser')

const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Preetham_1',
    port: 3306,
    connectionLimit: 5
});

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
let jsonParser = bodyParser.json()

const options = {
    swaggerDefinition: {
        info: {
            title: 'System Integration Week 5 Assignmnet',
            version: '1.0.0',
            description: ' Extracting and adding data into sample database'
        },
        host: 'localhost:3000',
        basePath: '/',
    },
    apis: ['./server.js'],
};

const specs = swaggerJsdoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

/**
 * @swagger
 * /customers:
 *      get:
 *          description:
 *              Gets the details of all customers
 *          produces:
 *              -application/json
 *          responses:
 *              200:    
 *                  description: Array of existing customers
 */
app.get('/customers', function (req, resp) {
    pool.query('SELECT * FROM sample.customer')
        .then(res => {
            resp.statusCode = 200;
            resp.setHeader('Content-Type', 'Application/json');
            resp.send(res);
        })
        .catch(err => console.error('Error exccuting query', err.stack));
});

/**
 * @swagger
 * /student:
 *      get:
 *          description:
 *              Gets the details of all students
 *          produces:
 *              -application/json
 *          responses:
 *              200:    
 *                  description: Array of existing students
 */
app.get('/student', function (req, resp) {
    pool.query('SELECT * FROM sample.student')
        .then(res => {
            resp.statusCode = 200;
            resp.setHeader('Content-Type', 'Application/json');
            resp.send(res);
        })
        .catch(err => console.error('Error exccuting query', err.stack));
});

/**
 * @swagger
 * /foods:
 *      get:
 *          description:
 *              Gets the details of all food items
 *          produces:
 *              -application/json
 *          responses:
 *              200:    
 *                  description: Array of existing food items.
*/
app.get('/foods', function (req, resp) {
    console.log(req.body)
    pool.query('SELECT * FROM sample.foods')
        .then(res => {
            resp.statusCode = 200;
            resp.setHeader('Content-Type', 'Application/json');
            resp.send(res);
        })
        .catch(err => console.error('Error exccuting query', err.stack));
});


/**
 * @swagger
 * definitions:
 *      student:
 *          properties:
 *              name:
 *                  type: string
 *              rollid:
 *                  type: integer
 *              title:
 *                  type: string
 *              class:
 *                  tyepe: string
 *              section:
 *                  tyepe: string
 */


/**
 * @swagger
 * /student:
 *  post:
 *      description: Creates a new Student
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: student
 *            description: student object
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/student'
 *      responses:
 *          200:
 *              description: Success
 */
app.post('/student', jsonParser, (req, resp) => {

    const student = req.body;
    console.log(student);
    if (!student.rollid || !student.name || !student.title || !student.class || !student.section || typeof (student.rollid) !== 'number') {
        console.log("error");
        resp.statusCode = 400;
        resp.send({ error: "Bad Request (Fields are incorrect or missing)" });
    }
    else {
        pool.query(`Insert into sample.student values(\'${student.name}\',\'${student.title}\',\'${student.class}\',\'${student.section}\',${student.rollid})`)
            .then(res => {
                pool.query(`SELECT * FROM sample.student where student.rollid= ${student.rollid}`)
                    .then(res => {
                        resp.statusCode = 201;
                        resp.setHeader('Content-Type', 'Application/json');
                        resp.send(res);
                    })
                    .catch(err => console.error('Error exccuting query', err.stack));
            })
            .catch(err => {
                resp.statusCode = 400;
                resp.setHeader('Content-Type', 'Application/json');
                resp.send(err);
            })
    }
});


/**
 * @swagger
 * /student/{rollid}:
 *      delete:
 *          description:
 *              Deletes a student based on Id
 *          produces:
 *              -application/json
 *          parameters:
 *              - name: rollid
 *                description: Student Id
 *                in: path
 *                required: true
 *          schema:
 *              type: integer
 *              minimum: 1
 *          responses:
 *              204:  
 *                  description: Succesfully Deleted  
*/
app.delete(`/student/:rollId`, jsonParser, (req, resp) => {
    const rollId = parseInt(req.params.rollId);
    console.log(rollId);
    if (!rollId) {
        console.log("error");
        resp.statusCode = 400;
        resp.send({ error: "rollId is incorrect or missing" });
    }
    else {
        pool.query(`Select count(*) as count from sample.student where rollid =${rollId}`)
            .then((res) => {
                console.log(res, res[0].count);
                if (res[0].count) {
                    pool.query(`Delete from sample.student where rollid=${rollId}`)
                        .then(res => {
                            resp.statusCode = 204;
                            resp.setHeader('Content-Type', 'Application/json');
                            resp.send({});
                        })
                }
                else {
                    resp.statusCode = 400;
                    resp.setHeader('Content-Type', 'Application/json');
                    resp.send({ data: 'Invalid RollID' });
                }
            }).catch(err => {
                resp.statusCode = 400;
                resp.setHeader('Content-Type', 'Application/json');
                resp.send(err);
            });
    }
});


/**
 * @swagger
 * /student:
 *      put:
 *          description:
 *              Updates a student if student is already present else creates a new student.
 *          produces:
 *              -application/json
 *          parameters:
 *              - name: student
 *                description: student object
 *                in: body
 *                required: true
 *                schema:
 *                     $ref: '#/definitions/student'
 *          responses:
 *              201:    
 *                 description: Returns updated/created student data
 */
app.put('/student', jsonParser, (req, resp) => {
    const student = req.body;
    console.log(student);
    if (!student.rollid || !student.name || !student.title || !student.class || !student.section || typeof (student.rollid) !== 'number') {
        console.log("error");
        resp.statusCode = 400;
        resp.send({ error: "Bad Request (Fields are incorrect or missing)" });
    }
    else {
        pool.query(`Select count(*) as count from sample.student where rollid =${student.rollid}`)
            .then((res) => {
                console.log(res, res[0].count);
                if (!res[0].count === 1) {
                    pool.query(`Insert into sample.student values(\'${student.name}\',\'${student.title}\',\'${student.class}\',\'${student.section}\',${student.rollid})`);

                }
                else {
                    pool.query(`Update sample.student set student.name=\'${student.name}\',student.title=\'${student.title}\',student.class=\'${student.class}\',student.section=\'${student.section}\',student.rollid=${student.rollid} where student.rollid=${student.rollid}`)
                        .catch(err => {
                            resp.statusCode = 400;
                            resp.setHeader('Content-Type', 'Application/json');
                            resp.send(err);
                        });
                }
                pool.query(`SELECT * FROM sample.student where student.rollid= ${student.rollid}`)
                    .then(res => {
                        resp.statusCode = 201;
                        resp.setHeader('Content-Type', 'Application/json');
                        resp.send(res);
                    })
                    .catch(err => console.error('Error exccuting query', err.stack));
            }).catch(err => {
                resp.statusCode = 400;
                resp.setHeader('Content-Type', 'Application/json');
                resp.send(err);
            })
    }
});


/**
 * @swagger
 * /student/{rollid}:
 *      patch:
 *          description:
 *              Updates a student details, if student is already present.
 *          parameters:
 *              - in: path
 *                name: Student rollId  
 *                required: true
 *              - in: body
 *                name: Student details
 *                description: Student values
 *                required: true
 *                properties:
 *                    name:
 *                      type: string
 *                    title:
 *                      type: string
 *                    class:
 *                      tyepe: string
 *                    section:
 *                      tyepe: string
 *                
 *          produces:
 *              -application/json
 *          responses:
 *              201:    
 *                 description: Returns updated student data
 */

app.patch('/student/:rollid', jsonParser, (req, resp) => {
    const student = req.body;
    const rollid = Number(req.params.rollid);
    console.log(rollid);
    console.log(student);
    console.log(Object.keys(student).length);
    if (!rollid || typeof (rollid) !== 'number' || Object.keys(student).length === 0) {
        console.log("error");
        resp.statusCode = 400;
        resp.send({ error: "Rollid not found or rollid is not an integer or empty body" });
    }
    else {
        console.log(rollid);
        pool.query(`Select count(*) as count from sample.student where rollid = ${rollid}`)
            .then((res) => {
                console.log(res[0].count);
                if (res[0].count === 1) {

                    let query = "Update sample.student set "
                    if (student.section) query += `section=\'${student.section}\' ,`;
                    if (student.name) query += `name=\'${student.name}\' ,`;
                    if (student.class) query += `class=\'${student.class}\' ,`;
                    if (student.title) query += `title=\'${student.title}\' ,`;
                    query = query.substr(0, query.length - 1);
                    query += `where rollid=${rollid}`;
                    console.log(query);
                    pool.query(query).catch((err) => {
                        resp.statusCode = 400;
                        resp.setHeader('Content-Type', 'Application/json');
                        resp.send(err);
                    });

                }
                else {
                    resp.statusCode = 400;
                    resp.setHeader('Content-Type', 'Application/json');
                    resp.send({ data: "Incorrect rollid" });
                }
            })
            .then(() => {
                pool.query(`SELECT * FROM sample.student where student.rollid= ${rollid}`)
                    .then(res => {
                        resp.statusCode = 201;
                        resp.setHeader('Content-Type', 'Application/json');
                        resp.send(res);
                    })
                    .catch(err => console.error('Error exccuting query', err.stack));
            })
            .catch(err => {
                resp.statusCode = 400;
                resp.setHeader('Content-Type', 'Application/json');
                resp.send(err);
            })
    }
});




app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`, port);
});