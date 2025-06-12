const mongoose = require('mongoose');
require('./models/Skill.js');
require('./models/User.js');

mongoose.connect('mongodb://localhost:27017/skillswap')
  .then(async () => {
    console.log('Connected to MongoDB');
    const Skill = mongoose.model('Skill');
    
    // Find all skills for the user
    const userId = '684a82a8f614362af743f6e2';
    const skills = await Skill.find({ userId, isActive: true });
    console.log('All skills for user:', skills.length);
    skills.forEach(skill => {
      console.log('Skill:', skill.name, 'Type:', skill.type, 'ID:', skill._id.toString());
    });
    
    const teachSkills = await Skill.find({ userId, type: 'teach', isActive: true });
    const learnSkills = await Skill.find({ userId, type: 'learn', isActive: true });
    console.log('Teach skills:', teachSkills.length);
    console.log('Learn skills:', learnSkills.length);
    
    // Check the specific skills that were just added
    const timeManagement = await Skill.findOne({ userId, name: 'Time Management' });
    const digitalArt = await Skill.findOne({ userId, name: 'Digital Art' });
    
    if (timeManagement) {
      console.log('Time Management skill - Type:', timeManagement.type, 'Active:', timeManagement.isActive);
    }
    if (digitalArt) {
      console.log('Digital Art skill - Type:', digitalArt.type, 'Active:', digitalArt.isActive);
    }
    
    mongoose.disconnect();
  })
  .catch(console.error);
