import type { Message, Concept, ConceptStatus } from '../types';

export const CONCEPTS_DATA: Omit<Concept, 'status' | 'citationCount' | 'lastDiscussedAt'>[] = [
  {
    id: 'supervised_vs_unsupervised',
    name: 'Supervised vs Unsupervised',
    description: 'The division between learning from labeled inputs with unambiguous ground truth versus finding hidden structures in unlabeled data.',
    lectureWeek: 1,
    slides: [{ week: 1, slide: 2 }],
    relatedIds: ['linear_models', 'loss_functions']
  },
  {
    id: 'linear_models',
    name: 'The Linear Model',
    description: 'The basic hypothesis class representing a weighted sum of inputs plus a bias offset: f(x) = w^T x + b.',
    lectureWeek: 1,
    slides: [{ week: 1, slide: 3 }],
    relatedIds: ['supervised_vs_unsupervised', 'loss_functions']
  },
  {
    id: 'loss_functions',
    name: 'Loss Functions',
    description: 'Mathematical metrics defining how "good" or "bad" a model\'s prediction is, guiding the optimization process.',
    lectureWeek: 1,
    slides: [
      { week: 1, slide: 2 },
      { week: 1, slide: 4 },
      { week: 1, slide: 6 },
      { week: 1, slide: 7 },
      { week: 1, slide: 10 },
      { week: 1, slide: 11 }
    ],
    relatedIds: ['squared_error', 'absolute_error', 'cross_entropy']
  },
  {
    id: 'squared_error',
    name: 'Squared Error Loss',
    description: 'The standard loss for regression that penalizes errors quadratically, making it smooth and convex but highly sensitive to outliers.',
    lectureWeek: 1,
    slides: [{ week: 1, slide: 4 }, { week: 1, slide: 5 }],
    relatedIds: ['linear_models', 'absolute_error']
  },
  {
    id: 'absolute_error',
    name: 'Absolute Error Loss',
    description: 'An alternative regression loss that scales linearly. It is robust to outliers, but non-differentiable at zero.',
    lectureWeek: 1,
    slides: [{ week: 1, slide: 6 }],
    relatedIds: ['squared_error']
  },
  {
    id: 'sigmoid',
    name: 'Sigmoid Activation',
    description: 'A logistic function that squashes real numbers into (0, 1) to represent probabilities, which saturates and causes gradient vanishing.',
    lectureWeek: 1,
    slides: [{ week: 1, slide: 8 }, { week: 1, slide: 9 }, { week: 2, slide: 9 }],
    relatedIds: ['cross_entropy', 'vanishing_gradient']
  },
  {
    id: 'cross_entropy',
    name: 'Cross-Entropy Loss',
    description: 'The standard classification loss that penalizes incorrect confident predictions exponentially, driving faster model learning.',
    lectureWeek: 1,
    slides: [{ week: 1, slide: 10 }, { week: 1, slide: 11 }],
    relatedIds: ['sigmoid']
  },
  {
    id: 'closed_form',
    name: 'Closed-Form Solution',
    description: 'Direct analytical solution for linear regression w* = (X^T X)^-1 X^T y. Bypasses iteration but requires expensive matrix inversion O(d^3).',
    lectureWeek: 1,
    slides: [{ week: 1, slide: 12 }, { week: 1, slide: 13 }],
    relatedIds: ['linear_models', 'gradient_descent']
  },
  {
    id: 'feature_scaling',
    name: 'Feature Scaling',
    description: 'Standardizing features to zero mean and unit variance, preventing highly elongated loss surfaces and improving convergence speeds.',
    lectureWeek: 1,
    slides: [{ week: 1, slide: 14 }],
    relatedIds: ['gradient_descent']
  },
  {
    id: 'gradient_descent',
    name: 'Gradient Descent',
    description: 'Iterative optimization algorithm that steps in the direction opposite to the loss gradient to locate a local minimum.',
    lectureWeek: 2,
    slides: [
      { week: 2, slide: 2 },
      { week: 2, slide: 3 },
      { week: 2, slide: 4 },
      { week: 2, slide: 5 },
      { week: 2, slide: 14 }
    ],
    relatedIds: ['closed_form', 'learning_rate', 'backpropagation']
  },
  {
    id: 'learning_rate',
    name: 'Learning Rate',
    description: 'Hyperparameter controlling step size. Setting it too small results in slow training; setting it too large causes divergence.',
    lectureWeek: 2,
    slides: [{ week: 2, slide: 4 }],
    relatedIds: ['gradient_descent', 'optimizers']
  },
  {
    id: 'chain_rule',
    name: 'Chain Rule',
    description: 'The mathematical basis of backpropagation, expressing the derivative of composite functions layer by layer.',
    lectureWeek: 2,
    slides: [{ week: 2, slide: 6 }],
    relatedIds: ['backpropagation']
  },
  {
    id: 'backpropagation',
    name: 'Backpropagation',
    description: 'Systematic application of the chain rule to calculate loss gradients with respect to neural network weights, reusing stored activation values.',
    lectureWeek: 2,
    slides: [{ week: 2, slide: 6 }, { week: 2, slide: 7 }, { week: 2, slide: 8 }],
    relatedIds: ['gradient_descent', 'vanishing_gradient']
  },
  {
    id: 'vanishing_gradient',
    name: 'Vanishing Gradient',
    description: 'Shrinkage of gradients as they travel back through deep networks, caused by multiplying activations (like sigmoid) that have derivatives ≤ 0.25.',
    lectureWeek: 2,
    slides: [{ week: 2, slide: 9 }, { week: 2, slide: 10 }],
    relatedIds: ['sigmoid', 'relu', 'backpropagation']
  },
  {
    id: 'relu',
    name: 'ReLU Activation',
    description: 'Rectified Linear Unit function max(0, z). Has a constant derivative of 1 for positive inputs, avoiding vanishing gradients but risking dying ReLUs.',
    lectureWeek: 2,
    slides: [{ week: 2, slide: 11 }],
    relatedIds: ['vanishing_gradient']
  },
  {
    id: 'optimizers',
    name: 'Momentum & Adam',
    description: 'Advanced optimization updates. Momentum dampens oscillations using velocity; Adam adapts step sizes per weight using moving averages.',
    lectureWeek: 2,
    slides: [{ week: 2, slide: 12 }, { week: 2, slide: 13 }],
    relatedIds: ['gradient_descent', 'learning_rate']
  },
  {
    id: 'overfitting',
    name: 'Overfitting',
    description: 'When a model captures noise and sample-specific structures in training data, causing training loss to drop but validation loss to rise.',
    lectureWeek: 3,
    slides: [{ week: 3, slide: 2 }, { week: 3, slide: 3 }, { week: 3, slide: 4 }],
    relatedIds: ['bias_variance', 'early_stopping']
  },
  {
    id: 'bias_variance',
    name: 'Bias-Variance Decomposition',
    description: 'Splitting expected error into model simplicity (bias), sample sensitivity (variance), and statistical noise (irreducible error).',
    lectureWeek: 3,
    slides: [{ week: 3, slide: 5 }],
    relatedIds: ['overfitting']
  },
  {
    id: 'l2_regularization',
    name: 'L2 Regularization (Ridge)',
    description: 'Adds a squared weight penalty to the loss function, causing weights to decay toward zero and encouraging smoother mappings.',
    lectureWeek: 3,
    slides: [{ week: 3, slide: 6 }],
    relatedIds: ['l1_regularization']
  },
  {
    id: 'l1_regularization',
    name: 'L1 Regularization (Lasso)',
    description: 'Adds an absolute weight penalty, driving some weights to precisely zero, yielding interpretable models and feature selection.',
    lectureWeek: 3,
    slides: [{ week: 3, slide: 7 }, { week: 3, slide: 8 }],
    relatedIds: ['l2_regularization']
  },
  {
    id: 'dropout',
    name: 'Dropout',
    description: 'Randomly zeroing out network activations during training, pushing the model to build robust, distributed representations.',
    lectureWeek: 3,
    slides: [{ week: 3, slide: 9 }],
    relatedIds: ['overfitting']
  },
  {
    id: 'early_stopping',
    name: 'Early Stopping',
    description: 'Stops training the moment validation loss begins rising, serving as a highly effective, cost-free regularization method.',
    lectureWeek: 3,
    slides: [{ week: 3, slide: 10 }],
    relatedIds: ['overfitting']
  },
  {
    id: 'model_validation',
    name: 'Train / Val / Test Split',
    description: 'Methodology for guarding models: Training fits weights, Validation tunes parameters, and Test provides the final unseen performance gauge.',
    lectureWeek: 3,
    slides: [{ week: 3, slide: 11 }, { week: 3, slide: 12 }],
    relatedIds: ['overfitting']
  },
  {
    id: 'data_augmentation',
    name: 'Data Augmentation',
    description: 'Enlarges datasets by applying label-preserving transformations (like crops or flips for images) to encode assumptions.',
    lectureWeek: 3,
    slides: [{ week: 3, slide: 13 }],
    relatedIds: ['overfitting']
  }
];

// Helper keywords indicating student uncertainty
const CONFUSION_KEYWORDS = [
  'stuck',
  'mix up',
  'mixing up',
  'confused',
  'dont understand',
  'don\'t understand',
  'why does',
  'why did',
  'is this right',
  'wrong',
  'fail',
  'error',
  'what\'s the difference',
  'whats the difference',
  'explain the difference',
  'diff'
];

/**
 * Iterates through message history and returns the concept states.
 */
export function extractConcepts(messages: Message[]): Concept[] {
  // Initialize concept map
  const concepts: Concept[] = CONCEPTS_DATA.map((c) => ({
    ...c,
    status: 'unexplored' as ConceptStatus,
    citationCount: 0,
  }));

  // Match helper
  const findConceptForSlide = (week: number, slideNum: number): Concept | undefined => {
    return concepts.find((c) =>
      c.slides.some((s) => s.week === week && s.slide === slideNum)
    );
  };

  // Keep track of which turns expressed confusion to mark following citations as needs_review
  const confusionAtTurn: { [index: number]: boolean } = {};

  messages.forEach((msg, idx) => {
    if (msg.role === 'user') {
      const text = msg.content.toLowerCase();
      const isConfused = CONFUSION_KEYWORDS.some((kw) => text.includes(kw));
      confusionAtTurn[idx] = isConfused;
    } else if (msg.role === 'assistant') {
      const userMsgIdx = idx - 1;
      const userExpressedConfusion = userMsgIdx >= 0 ? confusionAtTurn[userMsgIdx] : false;
      const isFailedOrCancelled = msg.error || msg.isCancelled;

      if (msg.citations) {
        msg.citations.forEach((cit) => {
          // Parse week number from lecture string (e.g. "Week 2 — Gradient Descent...")
          const weekMatch = cit.lecture.match(/Week (\d+)/i);
          const week = weekMatch ? parseInt(weekMatch[1], 10) : 0;
          const slide = cit.slide;

          const concept = findConceptForSlide(week, slide);
          if (concept) {
            concept.citationCount += 1;
            concept.lastDiscussedAt = msg.created_at;

            // Determine status
            if (userExpressedConfusion || isFailedOrCancelled || concept.citationCount > 1) {
              concept.status = 'needs_review';
            } else if (concept.status !== 'needs_review') {
              concept.status = 'covered';
            }
          }
        });
      }
    }
  });

  // Additionally, if a concept is connected to a concept that needs review, 
  // or if we have special custom heuristics, we can check. 
  // But let's keep it simple, precise, and deterministic.

  return concepts;
}

/**
 * Extracts course progress statistics.
 */
export function getCourseProgress(concepts: Concept[]) {
  const total = concepts.length;
  const explored = concepts.filter((c) => c.status !== 'unexplored').length;
  const needsReview = concepts.filter((c) => c.status === 'needs_review').length;
  const unexplored = concepts.filter((c) => c.status === 'unexplored').length;
  const covered = concepts.filter((c) => c.status === 'covered').length;

  return {
    total,
    explored,
    needsReview,
    unexplored,
    covered,
    percentage: total > 0 ? Math.round((explored / total) * 100) : 0
  };
}
