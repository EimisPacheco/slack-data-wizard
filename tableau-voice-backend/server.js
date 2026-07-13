import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from current directory
app.use(express.static(__dirname));

// Add Permissions-Policy headers for microphone access
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'microphone=(self), screen-wake-lock=(self)');
  res.setHeader('Feature-Policy', "microphone 'self'; screen-wake-lock 'self'");
  next();
});

// In-memory command queue
let commandQueue = [];
let commandIdCounter = 0;

// POST endpoint - Voice agent sends commands here
app.post('/api/command', (req, res) => {
  console.log('=== INCOMING REQUEST ===');
  console.log('Body:', req.body);
  
  let action, worksheet, field, value;
  
  // Handle ElevenLabs format: {command_type: "set_filter", command_value: "Prospecting"}
  if (req.body.command_type && req.body.command_value) {
    action = 'set_filter';
    worksheet = 'Stages';  // Default worksheet
    field = 'Stage';       // Default field
    value = req.body.command_value;  // The stage name
    
    console.log('✅ Detected ElevenLabs format');
  }
  // Handle standard format: {action, worksheet, field, value}
  else if (req.body.action) {
    action = req.body.action;
    worksheet = req.body.worksheet;
    field = req.body.field;
    value = req.body.value;
    
    console.log('✅ Detected standard format');
  }
  // Handle nested parameters
  else if (req.body.parameters) {
    action = req.body.parameters.action || 'set_filter';
    worksheet = req.body.parameters.worksheet;
    field = req.body.parameters.field;
    value = req.body.parameters.value;
    
    console.log('✅ Detected nested parameters format');
  }
  
  console.log('Extracted values:', { action, worksheet, field, value });
  
  const command = {
    commandId: `cmd_${++commandIdCounter}_${Date.now()}`,
    action: action || 'set_filter',
    worksheet: worksheet || 'Stages',
    field: field || 'Stage',
    value,
    timestamp: Date.now()
  };
  
  commandQueue.push(command);
  console.log('✅ Command added:', command);
  console.log('========================\n');
  
  res.json({ ok: true, commandId: command.commandId });
});

// GET endpoint - Tableau extension polls this
app.get('/poll', (req, res) => {
  const sinceId = req.query.sinceId || '';
  
  // Find new commands after sinceId
  let newCommands = commandQueue;
  
  if (sinceId) {
    const idx = commandQueue.findIndex(c => c.commandId === sinceId);
    if (idx >= 0) {
      newCommands = commandQueue.slice(idx + 1);
    }
  }
  
  // Return the first new command if any
  if (newCommands.length > 0) {
    const cmd = newCommands[0];
    res.json({ 
      ok: true, 
      action: {
        id: cmd.commandId,
        action: cmd.action,
        worksheet: cmd.worksheet,
        field: cmd.field,
        value: cmd.value
      }
    });
  } else {
    res.json({ ok: true, action: null });
  }
  
  // Clean up old commands (keep last 100)
  if (commandQueue.length > 100) {
    commandQueue = commandQueue.slice(-100);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Server running', queueSize: commandQueue.length });
});

// Serve index.html from root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve voice.html from root
app.get('/voice', (req, res) => {
  res.sendFile(path.join(__dirname, 'voice.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Tableau Extension: http://localhost:${PORT}/index.html`);
  console.log(`🎤 Voice Agent: http://localhost:${PORT}/voice`);
});