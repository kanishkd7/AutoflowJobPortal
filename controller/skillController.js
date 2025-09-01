const db = require('../models');
const JobNotificationService = require('../utils/jobNotificationService');


exports.addSkill = async (req, res) => {
  try {
    const { name, level } = req.body;
    const userId = req.user.id;

      if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

   
    const existingSkill = await db.Skill.findOne({
      where: { 
        userId,
        name: name.trim().toLowerCase()
      }
    });

    if (existingSkill) {
      return res.status(400).json({ error: 'Skill already exists for this user' });
    }

    const skill = await db.Skill.create({
      userId,
      name: name.trim().toLowerCase(),
      level: level || 'Intermediate'
    });

   
    JobNotificationService.processExistingJobsForUser(userId)
      .then(() => {
        console.log(`Processed existing jobs for user ${userId} after adding skill`);
      })
      .catch(error => {
        console.error('Error processing existing jobs for user:', error);
      });

    res.status(201).json({
      message: 'Skill added successfully',
      skill: {
        id: skill.id,
        name: skill.name,
        level: skill.level
      }
    });

  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ error: 'Could not add skill' });
  }
};


exports.getUserSkills = async (req, res) => {
  try {
    const userId = req.user.id;

    const skills = await db.Skill.findAll({
      where: { userId },
      attributes: ['id', 'name', 'level', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      skills,
      totalSkills: skills.length
    });

  } catch (error) {
    console.error('Error getting user skills:', error);
    res.status(500).json({ error: 'Could not fetch skills' });
  }
};


exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level } = req.body;
    const userId = req.user.id;

    
    const skill = await db.Skill.findOne({
      where: { id, userId }
    });

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    
    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim().toLowerCase();
    if (level) updateData.level = level;

    await skill.update(updateData);

    res.json({
      message: 'Skill updated successfully',
      skill: {
        id: skill.id,
        name: skill.name,
        level: skill.level
      }
    });

  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Could not update skill' });
  }
};


exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

      const skill = await db.Skill.findOne({
      where: { id, userId }
    });

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    await skill.destroy();

    res.json({ message: 'Skill deleted successfully' });

  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Could not delete skill' });
  }
};

exports.addMultipleSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    const userId = req.user.id;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Skills array is required' });
    }

    const addedSkills = [];
    const errors = [];

    for (const skillData of skills) {
      try {
        const { name, level } = skillData;
        
        if (!name || !name.trim()) {
          errors.push(`Skill name is required for skill: ${JSON.stringify(skillData)}`);
          continue;
        }

        const existingSkill = await db.Skill.findOne({
          where: { 
            userId,
            name: name.trim().toLowerCase()
          }
        });

        if (existingSkill) {
          errors.push(`Skill "${name}" already exists`);
          continue;
        }

        const skill = await db.Skill.create({
          userId,
          name: name.trim().toLowerCase(),
          level: level || 'Intermediate'
        });

        addedSkills.push({
          id: skill.id,
          name: skill.name,
          level: skill.level
        });

      } catch (error) {
        errors.push(`Error adding skill: `);
      }
    }
    
    if (addedSkills.length > 0) {
      JobNotificationService.processExistingJobsForUser(userId)
        .then(() => {
          console.log(`Processed existing jobs for user ${userId} after adding multiple skills`);
        })
        .catch(error => {
          console.error('Error processing existing jobs for user:', error);
        });
    }

    res.status(201).json({
      message: 'Skills processing completed',
      addedSkills,
      totalAdded: addedSkills.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error adding multiple skills:', error);
    res.status(500).json({ error: 'Could not add skills' });
  }
}; 