const db = require('../models');

exports.listAllJobs = async (req, res) => {
  const jobs = await db.Job.findAll({
    where: { status: 'approved' },
    include: [{ model: db.Company, as: 'company', attributes: { exclude: ['password'] } }]
  });
  res.json(jobs);
};

exports.getJob = async (req, res) => {
  const job = await db.Job.findByPk(req.params.id, {
    where: { status: 'approved' },
    include: [{ model: db.Company, as: 'company', attributes: { exclude: ['password'] } }]
  });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
};

exports.getPersonalizedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    
   
    const userSkills = await db.Skill.findAll({
      where: { userId },
      attributes: ['name', 'level']
    });

     
    if (userSkills.length === 0) {
      return res.status(400).json({
        error: 'No skills found',
        message: 'Please add your skills to get personalized job suggestions',
        action: 'add_skills'
      });
    }

   
    const skillNames = userSkills.map(skill => skill.name.toLowerCase());

    
    const allJobs = await db.Job.findAll({
      where: { status: 'approved' },
      include: [{ 
        model: db.Company, 
        as: 'company', 
        attributes: ['id', 'name', 'logo', 'location', 'website'] 
      }],
      attributes: [
        'id', 'title', 'description', 'location', 'salary', 
        'type', 'requirements', 'deadline', 'createdAt'
      ]
    });

    
    const personalizedJobs = allJobs.map(job => {
      let matchScore = 0;
      let matchedSkills = [];
      
      
      if (job.requirements) {
        const requirements = job.requirements.toLowerCase();
        
        skillNames.forEach(skillName => {
          if (requirements.includes(skillName)) {
            matchScore += 1;
            matchedSkills.push(skillName);
          }
        });
      }

      
      if (job.title) {
        const title = job.title.toLowerCase();
        skillNames.forEach(skillName => {
          if (title.includes(skillName) && !matchedSkills.includes(skillName)) {
            matchScore += 2; // Title match gets higher score
            matchedSkills.push(skillName);
          }
        });
      }

      
      if (job.description) {
        const description = job.description.toLowerCase();
        skillNames.forEach(skillName => {
          if (description.includes(skillName) && !matchedSkills.includes(skillName)) {
            matchScore += 0.5; // Description match gets lower score
            matchedSkills.push(skillName);
          }
        });
      }

      return {
        ...job.toJSON(),
        matchScore,
        matchedSkills,
        matchPercentage: Math.min((matchScore / skillNames.length) * 100, 100)
      };
    });

    const relevantJobs = personalizedJobs
      .filter(job => job.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

   
    const paginatedJobs = relevantJobs.slice(offset, offset + limit);

  
    const totalJobs = relevantJobs.length;
    const totalPages = Math.ceil(totalJobs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response = {
      jobs: paginatedJobs,
      userSkills: userSkills.map(skill => ({
        name: skill.name,
        level: skill.level
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalJobs,
        jobsPerPage: limit,
        hasNextPage,
        hasPrevPage
      },
      summary: {
        totalRelevantJobs: totalJobs,
        userSkillCount: userSkills.length,
        averageMatchPercentage: relevantJobs.length > 0 
          ? Math.round(relevantJobs.reduce((sum, job) => sum + job.matchPercentage, 0) / relevantJobs.length)
          : 0
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting personalized jobs:', error);
    res.status(500).json({ error: 'Could not fetch personalized jobs' });
  }
};