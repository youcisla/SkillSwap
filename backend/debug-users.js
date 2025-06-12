const mongoose = require('mongoose');
require('./models/User');
require('./models/Skill');

mongoose.connect('mongodb://localhost:27017/skillswap')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User');
    const Skill = mongoose.model('Skill');
    
    // Count total users
    const totalUsers = await User.countDocuments();
    console.log('Total users:', totalUsers);
    
    // Count active users
    const activeUsers = await User.countDocuments({ isActive: true });
    console.log('Active users:', activeUsers);
    
    // List all users with basic info
    const users = await User.find().select('name email city isActive');
    console.log('All users:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.city} - Active: ${user.isActive}`);
    });
    
    // Count total skills
    const totalSkills = await Skill.countDocuments();
    console.log('\nTotal skills:', totalSkills);
    
    // Count skills by type
    const teachSkills = await Skill.countDocuments({ type: 'teach', isActive: true });
    const learnSkills = await Skill.countDocuments({ type: 'learn', isActive: true });
    console.log('Teach skills:', teachSkills);
    console.log('Learn skills:', learnSkills);
    
    mongoose.disconnect();
  })
  .catch(console.error);
