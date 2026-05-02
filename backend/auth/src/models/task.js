const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ["Todo", "In Progress", "Done"],
    default: "Todo"
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  dueDate: Date
}, { timestamps: true });

module.exports = mongoose.models.Task || mongoose.model("Task", taskSchema);