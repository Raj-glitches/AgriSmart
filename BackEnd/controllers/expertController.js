import Consultation from '../models/Consultation.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * @desc    Create consultation question
 * @route   POST /api/expert/consultations
 * @access  Private/Farmer
 */
export const createConsultation = asyncHandler(async (req, res) => {
  const { title, description, category, images } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title and description',
    });
  }

  const consultation = await Consultation.create({
    farmer: req.user.id,
    title,
    description,
    category: category || 'general',
    images: images || [],
    status: 'open',
  });

  // Notify experts (via Socket.io) - non-blocking
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('new_consultation', { consultation });
    }
  } catch (error) {
    console.error('[ExpertController] Socket emit error:', error.message);
  }

  res.status(201).json({
    success: true,
    message: 'Consultation posted successfully',
    data: consultation,
  });
});

/**
 * @desc    Get all consultations
 * @route   GET /api/expert/consultations
 * @access  Private
 */
export const getConsultations = asyncHandler(async (req, res) => {
  const { status, category, myQuestions, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (myQuestions === 'true') query.farmer = req.user.id;
  if (req.user.role === 'expert') {
    // Experts can see open questions or ones they've responded to
    query.$or = [
      { status: 'open' },
      { 'responses.expert': req.user.id },
    ];
  }

  const consultations = await Consultation.find(query)
    .populate('farmer', 'name avatar location')
    .populate('expert', 'name avatar expertise')
    .populate('responses.expert', 'name avatar expertise')
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Consultation.countDocuments(query);

  res.status(200).json({
    success: true,
    count: consultations.length,
    total,
    data: consultations,
  });
});

/**
 * @desc    Get single consultation
 * @route   GET /api/expert/consultations/:id
 * @access  Private
 */
export const getConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id)
    .populate('farmer', 'name avatar location farmDetails')
    .populate('expert', 'name avatar expertise')
    .populate('responses.expert', 'name avatar expertise');

  if (!consultation) {
    return res.status(404).json({
      success: false,
      message: 'Consultation not found',
    });
  }

  // Increment views for public questions
  if (consultation.isPublic) {
    consultation.views += 1;
    await consultation.save();
  }

  res.status(200).json({
    success: true,
    data: consultation,
  });
});

/**
 * @desc    Respond to consultation (Expert only)
 * @route   POST /api/expert/consultations/:id/respond
 * @access  Private/Expert
 */
export const respondToConsultation = asyncHandler(async (req, res) => {
  const { content, attachments } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Response content is required',
    });
  }

  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) {
    return res.status(404).json({
      success: false,
      message: 'Consultation not found',
    });
  }

  if (consultation.status === 'closed') {
    return res.status(400).json({
      success: false,
      message: 'Consultation is closed',
    });
  }

  consultation.responses.push({
    expert: req.user.id,
    content,
    attachments: attachments || [],
  });

  // If first response, update status and assign expert
  if (!consultation.expert) {
    consultation.expert = req.user.id;
    consultation.status = 'in_progress';
  }

  await consultation.save();

  // Notify farmer (non-blocking)
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('consultation_response', {
        farmerId: consultation.farmer,
        consultationId: consultation._id,
      });
    }
  } catch (error) {
    console.error('[ExpertController] Socket emit error:', error.message);
  }

  res.status(201).json({
    success: true,
    message: 'Response added successfully',
    data: consultation,
  });
});

/**
 * @desc    Update consultation status
 * @route   PUT /api/expert/consultations/:id/status
 * @access  Private
 */
export const updateConsultationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) {
    return res.status(404).json({
      success: false,
      message: 'Consultation not found',
    });
  }

  // Only farmer or assigned expert can update
  if (
    consultation.farmer.toString() !== req.user.id &&
    consultation.expert?.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this consultation',
    });
  }

  consultation.status = status;
  await consultation.save();

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: consultation,
  });
});

/**
 * @desc    Rate consultation
 * @route   POST /api/expert/consultations/:id/rate
 * @access  Private/Farmer
 */
export const rateConsultation = asyncHandler(async (req, res) => {
  const { score, feedback } = req.body;

  if (!score || score < 1 || score > 5) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid rating between 1 and 5',
    });
  }

  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) {
    return res.status(404).json({
      success: false,
      message: 'Consultation not found',
    });
  }

  if (consultation.farmer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the farmer who asked the question can rate',
    });
  }

  consultation.rating = { score, feedback };
  await consultation.save();

  // Update expert's rating
  if (consultation.expert) {
    try {
      const expertRatings = await Consultation.find({
        expert: consultation.expert,
        'rating.score': { $exists: true, $ne: null },
      });

      if (expertRatings.length > 0) {
        const avgRating =
          expertRatings.reduce((acc, c) => acc + (c.rating?.score || 0), 0) /
          expertRatings.length;

        await User.findByIdAndUpdate(consultation.expert, {
          'expertise.rating': Number(avgRating.toFixed(1)),
        });
      }
    } catch (error) {
      console.error('[ExpertController] Failed to update expert rating:', error.message);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Rating submitted successfully',
    data: consultation,
  });
});

/**
 * @desc    Get expert list
 * @route   GET /api/expert/list
 * @access  Public
 */
export const getExperts = asyncHandler(async (req, res) => {
  const { specialization, search } = req.query;

  const query = { role: 'expert', isActive: true };
  if (specialization) query['expertise.specialization'] = specialization;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'expertise.specialization': { $regex: search, $options: 'i' } },
    ];
  }

  const experts = await User.find(query)
    .select('name avatar expertise location stats')
    .sort('-expertise.rating');

  res.status(200).json({
    success: true,
    count: experts.length,
    data: experts,
  });
});

