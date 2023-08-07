const Task = require("../models/taskModel");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// for comments images ...............................................
const cStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationDir = "uploads/Task/Comments";
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }
    cb(null, destinationDir);
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    const supportedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".gif", ".txt", ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt"];

    if (!supportedExtensions.includes(fileExtension.toLowerCase())) {
      return cb(new Error("Invalid file format. Only specific file extensions are allowed."));
    }

    const filename = file.fieldname + "_" + Date.now() + fileExtension;
    cb(null, filename);
  },
});
const cUpload = multer({ storage: cStorage }).single("file");

//.........................................



///for task images................................................
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const taskData = req.body;
    if (!taskData.title || !taskData.description) {
      return cb(new Error("title and description is required"));
    }
    const destinationDir = "uploads/Task";
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }
    cb(null, destinationDir);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    
    const filename = file.fieldname + "_" + Date.now() + extension;
    cb(null, filename);
  },
});
const upload = multer({ storage: storage }).single("file");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const taskData = req.body;
//     if (!taskData.title || !taskData.description) {
//       return cb(new Error("title and description are required"));
//     }
//     const destinationDir = "uploads/Task";
//     // Create the destination directory if it doesn't exist
//     if (!fs.existsSync(destinationDir)) {
//       fs.mkdirSync(destinationDir, { recursive: true });
//     }
//     cb(null, destinationDir);
//   },
//   filename: function (req, file, cb) {
//     const fileExtension = path.extname(file.originalname);
//     const supportedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".gif", ".txt", ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt"];

//     if (!supportedExtensions.includes(fileExtension.toLowerCase())) {
//       return cb(new Error("Invalid file format. Only specific file extensions are allowed."));
//     }

//     const filename = file.fieldname + "_" + Date.now() + fileExtension;
//     cb(null, filename);
//   },
// });

// const upload = multer({ storage: storage }).single("file");

//Add task............................
const addTask = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: "Failed to upload file" });
    }
    try {
      const loggedInUserId = req.user._id; // Assuming the user ID is available in the request after authentication
      const taskData = req.body;
      taskData.createdBy = loggedInUserId; // Set the createdBy field with the user ID
      // Check for required fields in the task data
      if (!taskData.title || !taskData.description) {
        return res.status(400).json({ error: "Title and description are required fields" });
      }
      // Check if a file was uploaded
      if (req.file) {
        const file = req.file;
        // Store the file information in the task or associate it with the task as needed
        taskData.file = {
          filename: file.filename,
          fileURL: `${req.protocol}://${req.get("host")}/${file.path}`,
        };
      }

      const task = new Task(taskData);
      const savedTask = await task.save();
      if (!req.file) {
        await Task.updateOne({ _id: task._id }, { $unset: { file: 1 } });
      }
      res.status(201).json(savedTask);
    } catch (error) {
      res.status(500).json({ Error: "Failed to create the task" });
    }
  });
};



//completed task.
const completeTask = async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ Error: "Task not found" });
    }

    task.status = 5; // Set status to "Completed"
    const completedTask = await task.save();

    res.status(200).json(completedTask);
  } catch (error) {
    res.status(500).json({ Error: "Failed to complete the task" });
  }
};

//getTask
const getTask = async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const task = await Task.findById(taskId).sort({ createdAt: -1 });
    if (!task) {
      return res.status(404).json({ Error: "Task not found" });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ Error: "Failed to retrieve task data" });
  }
};



//getTaskData by createdBy or responsible or participant or observers in Descending order

const getTaskData = async (req, res) => {
  try {
    // Check if the user is logged in
    const loggedInUserId = req.user._id; // Assuming the user ID is available in the request after authentication
    console.log(loggedInUserId);

    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    // Find the tasks associated with the logged-in user with pagination
    const tasks = await Task.find({
      $or: [
        { createdBy: loggedInUserId },
        { responsible: loggedInUserId },
        { participant: loggedInUserId },
        { observers: loggedInUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    if (tasks.length === 0) {
      return res.status(404).json({ Error: "No tasks found for the user" });
    }

    // Return the task data in the response
    res.json({
      status: 200,
      message: "success",
      data: tasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ Error: "Failed to retrieve task data" });
  }
};


//getTask by status
const getTaskByStatus = async (req, res) => {
  try {
    // Check if the user is logged in
    const loggedInUserId = req.user._id; // Assuming the user ID is available in the request after authentication

    const { status } = req.params; // Assuming the status is provided as a query parameter

    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    // Find the tasks associated with the logged-in user and matching status with pagination
    const tasks = await Task.find({
      $or: [
        { createdBy: loggedInUserId },
        { responsible: loggedInUserId },
        { participant: loggedInUserId },
        { observers: loggedInUserId },
      ],
      status: status, // Filter tasks based on the provided status
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    if (tasks.length === 0) {
      return res
        .status(404)
        .json({ Error: "No tasks found with the given status" });
    }

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ Error: "Failed to retrieve task data" });
  }
};


// const getTaskByStatus = async (req, res) => {
//   const status = req.params.status;

//   try {
//     const tasks = await Task.find({ status: status });

//     if (tasks.length === 0) {
//       return res.status(404).json({ error: "No tasks found with the given status" });
//     }

//     res.status(200).json(tasks);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to retrieve task data" });
//   }
// };

//gettingTaskData for 30days
const getTaskDataLast30Days = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    console.log(loggedInUserId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({
      $or: [
        { createdBy: loggedInUserId },
        { responsible: loggedInUserId },
        { participant: loggedInUserId },
        { observers: loggedInUserId },
      ],
      createdAt: { $gte: thirtyDaysAgo },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    if (tasks.length === 0) {
      return res
        .status(404)
        .json({ Error: "No tasks found within the last 30 days" });
    }

    res.json({
      status: 200,
      message: "success",
      data: tasks,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ Error: "Failed to retrieve task data", details: error.message });
  }
};

const getTaskDataLast7Days = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    console.log(loggedInUserId);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({
      $or: [
        { createdBy: loggedInUserId },
        { responsible: loggedInUserId },
        { participant: loggedInUserId },
        { observers: loggedInUserId },
      ],
      createdAt: { $gte: sevenDaysAgo },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    if (tasks.length === 0) {
      return res
        .status(404)
        .json({ Error: "No tasks found within the last 7 days" });
    }

    res.json({
      status: 200,
      message: "success",
      data: tasks,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ Error: "Failed to retrieve task data", details: error.message });
  }
};


const getTaskByRole = async (req, res) => {
  const { createdBy, responsible, participant, observers } = req.query;
  try {
    if (!createdBy && !responsible && !participant && !observers) {
      return res.status(400).json({ Error: "err" });
    }

    const query = {};

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (responsible) {
      query.responsible = responsible;
    }

    if (participant) {
      query.participant = participant;
    }

    if (observers) {
      query.observers = observers;
    }

    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    if (tasks.length === 0) {
      return res.status(404).json({ Error: "No tasks found" });
    }

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ Error: "Failed to retrieve task data" });
  }
};


//pause task
const pauseTask = async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ Error: "Task not found" });
    }

    task.status = 2; // Set status to "Pending"
    const pausedTask = await task.save();

    res.status(200).json(pausedTask);
  } catch (error) {
    res.status(500).json({ Error: "Failed to pause the task" });
  }
};

//renew a task
const renewTask = async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ Error: "Task not found" });
    }

    task.status = 2; // Set status to "Pending"
    task.closedTask = 0; // Reset closedTask to 0
    task.closedOn = null; // Reset closedOn to null
    const renewedTask = await task.save();

    res.status(200).json(renewedTask);
  } catch (error) {
    res.status(500).json({ Error: "Failed to renew the task" });
  }
};

//Add comment Task
// const addResultFromComment = async (req, res) => {
//   const taskId = req.params.taskId;
//   const commentText = req.body.text;

//   try {
//     const task = await Task.findById(taskId);
//     if (!task) {
//       return res.status(404).json({ Error: "Task not found" });
//     }

//     const newComment = {
//       authorId: req.user._id,
//       text: commentText,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };

//     task.comments.push(newComment); // Add the new comment to the task's comments array
//     const updatedTask = await task.save();

//     res.status(200).json(updatedTask);
//   } catch (error) {
//     res.status(500).json({ Error: error });
//   }
// };

//........................................Add comment Task

const addResultFromComment = async (req, res) => {
  const taskId = req.params.taskId;
  const commentText = req.body.text;
  cUpload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: "Failed to upload file" });
    }
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ Error: "Task not found" });
      }
      const newComment = {
        authorId: req.user._id,
        text: commentText,
        createdAt: new Date(),
        updatedAt: new Date(),
        cfile: {} // Initialize an empty object for cfile
      };
      if (!req.file && !newComment.text) {
        return res.status(400).json({ error: "Either a file or a comment is required" });
      }


      // file and comment both
      if (req.file && req.body.text) {
        const file = req.file;
       
        const fileExtension = path.extname(file.originalname);
        const supportedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".gif", ".txt", ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt"];
        if (!supportedExtensions.includes(fileExtension.toLowerCase())) {
      
          return res.status(400).json({ error: "Invalid file format. Only specific file extensions are allowed." });
        }

        const newComment = {
          authorId: req.user._id,
          text: req.body.text,
          createdAt: new Date(),
          updatedAt: new Date(),
          cfile: {
            filename: file.filename,
            fileURL: `${req.protocol}://${req.get("host")}/uploads/Task/Comments/${file.filename}`
          }
        };
        task.comments.push(newComment); // Add the new comment to the task's comments array
        const updatedTask = await task.save();
        return res.status(200).json(updatedTask);
      }

      // Check if a file was uploaded
      if (req.file) {
        const file = req.file;

        const fileExtension = path.extname(file.originalname);
        const supportedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".gif", ".txt", ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt"];
        if (!supportedExtensions.includes(fileExtension.toLowerCase())) {
          return res.status(400).json({ error: "Invalid file format. Only specific file extensions are allowed." });
        }
        // Save the file information in the new comment
        newComment.cfile.filename = file.filename;
        newComment.cfile.fileURL = `${req.protocol}://${req.get("host")}/uploads/Task/Comments/${file.filename}`;
      }
      task.comments.push(newComment); // Add the new comment to the task's comments array
      const updatedTask = await task.save();
      res.status(200).json(updatedTask);
    }
    // Check if both file and comment text are provided
    catch (error) {
      res.status(500).json({ Error: error });
    }
  });
};

//..............................................


const editComment = async (req, res) => {
  const taskId = req.params.taskId;
  const commentId = req.params.commentId;
  const newText = req.body.text;
  const updatedBy = req.user._id; // Assuming you have the user's ID available in req.user._id

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ Error: "Task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ Error: "Comment not found" });
    }

    // Check if the user is the admin
    if (req.user.userRole !== 'admin') {
      return res.status(403).json({ Error: "Unauthorized access" });
    }

    comment.text = newText;
    comment.updatedAt = Date.now(); // Update the updatedAt timestamp
    comment.updatedBy = updatedBy; // Se t the updatedBy field

    const updatedTask = await task.save();

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ Error: error });
  }
};


//Start Task:-

const startTask = async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ Error: "Task not found" });
    }

    task.status = 3; // Se t status to "In Progress"
    const progressTask = await task.save();

    res.status(200).json(progressTask);
  } catch (error) {
    res.status(500).json({ Error: "Failed to pause the task" });
  }
};

//Update Task

const updateTask = async (req, res) => {
  const taskId = req.params.taskId;
  const updates = req.body;

  try {
    const task = await Task.findByIdAndUpdate(taskId, updates, { new: true });

    if (!task) {
      return res.status(404).json({ Error: "Task not found" });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ Error: "Failed to update task" });
  }
}

module.exports = {
  addTask,
  completeTask,
  getTask,
  getTaskData,
  getTaskByStatus,
  getTaskDataLast30Days,
  getTaskDataLast7Days,
  getTaskByRole,
  pauseTask,
  renewTask,
  addResultFromComment,
  startTask,
  updateTask,
  editComment,
};