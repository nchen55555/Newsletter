// Course scoring system - modular and scalable for multiple schools

interface Course {
  course: string;
  grade: string;
  year: string;
}

interface CourseMapping {
  systems_infrastructure?: number;
  theory_statistics_ml?: number;
  product?: number;
  grade_sensitivity: number;
  year_weight?: number; // Optional course-specific year multiplier
}

interface SkillScores {
  systems_infrastructure: number;
  theory_statistics_ml: number;
  product: number;
}

interface SchoolConfig {
  name: string;
  courseMappings: Record<string, CourseMapping>;
  scoreRanges: {
    systems_infrastructure: { min: number; max: number };
    theory_statistics_ml: { min: number; max: number };
    product: { min: number; max: number };
  };
  yearMultipliers?: Record<string, number>; // Optional school-specific year multipliers
  gradeWeights?: Record<string, number>; // Optional school-specific grade weights
}

const BASELINE_SCORE = 10; // Everyone starts here

// Default grade multipliers (can be overridden per school)
const DEFAULT_GRADE_WEIGHTS: Record<string, number> = {
  'A+': 1.25,
  'A': 1.2,
  'A-': 1.0,
  'B+': 0.9,
  'B': 0.8,
  'B-': 0.7,
  'C+': 0.5,
  'C': 0.4,
  'C-': 0.4,
  'D+': 0.4,
  'D': 0.4,
  'D-': 0.4,
  'F': 0.0
};

// Default year multipliers (can be overridden per school)
const DEFAULT_YEAR_MULTIPLIERS: Record<string, number> = {
  '1': 1.2,  // Freshman year bonus
  '2': 1.0,  // Sophomore year slight bonus  
  '3': 1.0,  // Junior year neutral
  '4': 1.0,   // Senior year slight penalty
};


// Cache for loaded school configurations
const schoolConfigCache: Map<string, SchoolConfig | null> = new Map();

// Function to dynamically load school configuration
async function getSchoolConfig(school?: string): Promise<SchoolConfig | null> {
  if (!school) return null;
  
  const normalizedSchool = school.toLowerCase();
  
  // Check cache first
  if (schoolConfigCache.has(normalizedSchool)) {
    return schoolConfigCache.get(normalizedSchool) || null;
  }
  
  // Determine which school config to load
  let configFile: string | null = null;
  if (normalizedSchool.includes('harvard')) {
    configFile = 'harvard';
  } else if (normalizedSchool.includes('mit')) {
    configFile = 'mit';
  }
  // Add more schools here as needed
  
  if (!configFile) {
    console.log('⚠️ No course mapping found for school:', school);
    schoolConfigCache.set(normalizedSchool, null);
    return null;
  }
  
  try {
    // Dynamically import the school configuration
    const config = await import(`./course-mappings/${configFile}.json`);
    const schoolConfig: SchoolConfig = config.default || config;
    
    console.log(`📚 Loaded course mapping for ${schoolConfig.name}`);
    schoolConfigCache.set(normalizedSchool, schoolConfig);
    return schoolConfig;
  } catch (error) {
    console.error(`❌ Failed to load course mapping for ${configFile}:`, error);
    schoolConfigCache.set(normalizedSchool, null);
    return null;
  }
}

export async function calculateSkillScores(transcript: Course[], school?: string): Promise<SkillScores | null> {
  if (!school) {
    console.log('⚠️ No school provided, skipping skill calculation');
    return null;
  }

  // Load school configuration
  const schoolConfig = await getSchoolConfig(school);
  if (!schoolConfig) {
    console.log(`⚠️ No course mapping found for school: ${school}, skipping skill calculation`);
    return null;
  }

  console.log(`📊 Calculating skill scores using ${schoolConfig.name} mappings`);

  // Initialize with baseline
  const scores: SkillScores = {
    systems_infrastructure: BASELINE_SCORE,
    theory_statistics_ml: BASELINE_SCORE,
    product: BASELINE_SCORE
  };
  
  // Use school-specific or default multipliers
  const yearMultipliers = schoolConfig.yearMultipliers || DEFAULT_YEAR_MULTIPLIERS;
  const gradeWeights = schoolConfig.gradeWeights || DEFAULT_GRADE_WEIGHTS;
  
  for (const courseEntry of transcript) {
    const { course, grade, year } = courseEntry;
    
    // Check if course maps to any skill areas in this school's configuration
    if (course in schoolConfig.courseMappings) {
      const mapping = schoolConfig.courseMappings[course];
      
      // Get grade sensitivity for this course (default to 1.0 if not specified)
      const gradeSensitivity = mapping.grade_sensitivity || 1.0;
      
      // Calculate grade impact with sensitivity
      const baseGradeWeight = gradeWeights[grade] || 1.0;
      
      // Apply grade sensitivity:
      // If grade_sensitivity = 2.0, an A becomes even better and a B becomes worse
      // If grade_sensitivity = 0.5, grades matter less
      let gradeImpact: number;
      if (baseGradeWeight >= 1.0) {
        // For good grades (A, A-, B+), amplify the bonus
        gradeImpact = 1.0 + (baseGradeWeight - 1.0) * gradeSensitivity;
      } else {
        // For bad grades (B-, C+, C), amplify the penalty
        gradeImpact = 1.0 - (1.0 - baseGradeWeight) * gradeSensitivity;
      }
      
      // Get year multiplier based on when taken
      const yearMultiplier = yearMultipliers[year] || 1.0;
      
      // Get course-specific year weight (default 1.0 if not specified)
      const courseYearWeight = mapping.year_weight || 1.0;
      
      // Combine both: course importance * year timing
      const finalYearWeight = courseYearWeight * yearMultiplier;
      
      // Apply contributions to each skill area
      for (const [skillArea, relevanceWeight] of Object.entries(mapping)) {
        if (skillArea === 'grade_sensitivity' || skillArea === 'year_weight') {
          continue; // Skip the metadata fields
        }
        
        if (skillArea in scores && typeof relevanceWeight === 'number') {
          // Core calculation
          const contribution = (
            relevanceWeight *    // 0.0 - 1.0 (how relevant is this course)
            finalYearWeight *    // Course importance * year timing
            gradeImpact          // Modified by grade_sensitivity
          );
          
          (scores as Record<keyof SkillScores, number>)[skillArea as keyof SkillScores] += contribution;
        }
      }
    }
  }
  
  // Standardize scores to 0-100 scale using school-specific ranges
  const standardizedScores: SkillScores = {
    systems_infrastructure: Math.max(0, Math.min(100, 
      ((scores.systems_infrastructure - schoolConfig.scoreRanges.systems_infrastructure.min) / 
       (schoolConfig.scoreRanges.systems_infrastructure.max - schoolConfig.scoreRanges.systems_infrastructure.min)) * 100
    )),
    theory_statistics_ml: Math.max(0, Math.min(100,
      ((scores.theory_statistics_ml - schoolConfig.scoreRanges.theory_statistics_ml.min) / 
       (schoolConfig.scoreRanges.theory_statistics_ml.max - schoolConfig.scoreRanges.theory_statistics_ml.min)) * 100
    )),
    product: Math.max(0, Math.min(100,
      ((scores.product - schoolConfig.scoreRanges.product.min) / 
       (schoolConfig.scoreRanges.product.max - schoolConfig.scoreRanges.product.min)) * 100
    ))
  };

  console.log("Sending over standardized scores ", standardizedScores)
  
  return standardizedScores;
}

// Helper function to get a summary of scores
export function getScoreSummary(scores: SkillScores): {
  highest: string;
  scores: SkillScores;
  recommendations: string[];
} {
  const skillNames = {
    systems_infrastructure: 'Systems & Infrastructure',
    theory_statistics_ml: 'Theory, Statistics & ML',
    product: 'Product Development'
  };
  
  // Find highest scoring area
  const highest = Object.entries(scores).reduce((a, b) => 
    scores[a[0] as keyof SkillScores] > scores[b[0] as keyof SkillScores] ? a : b
  )[0] as keyof SkillScores;
  
  // Generate recommendations based on scores
  const recommendations: string[] = [];
  
  if (scores.systems_infrastructure > 12) {
    recommendations.push('Strong systems background - consider backend/infrastructure roles');
  }
  if (scores.theory_statistics_ml > 12) {
    recommendations.push('Strong theoretical foundation - consider ML/data science roles');
  }
  if (scores.product > 12) {
    recommendations.push('Product-oriented coursework - consider product management or full-stack roles');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Developing technical foundation - consider exploring different CS areas');
  }
  
  return {
    highest: skillNames[highest],
    scores,
    recommendations
  };
}

// Function to analyze transcript and return detailed results
export async function analyzeTranscript(transcript: Course[], school?: string) {
  const scores = await calculateSkillScores(transcript, school);
  if (!scores) {
    console.log(`⚠️ Skipping transcript analysis for school: ${school} - no course mapping available`);
    return null; // No analysis when no course mapping exists
  }
  
  // Load school config to count analyzed courses
  const schoolConfig = await getSchoolConfig(school);
  const analyzedCoursesCount = schoolConfig ? 
    transcript.filter(course => course.course in schoolConfig.courseMappings).length : 0;
  
  const summary = getScoreSummary(scores);
  
  return {
    raw_scores: scores,
    summary,
    course_count: transcript.length,
    analyzed_courses: analyzedCoursesCount,
    transcript
  };
}