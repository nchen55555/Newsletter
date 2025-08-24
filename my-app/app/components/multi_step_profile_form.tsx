'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import ProfileInfo from './profile_info'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProfileFormState, ProfileData } from '@/app/types'
import { useSubscriptionContext } from './subscription_context'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Terminal, CheckCircle2Icon } from 'lucide-react'
import CompanyCards from '@/app/companies/company-cards'
import { CompanyWithImageUrl } from '@/app/types'

interface MultiStepProfileFormProps extends ProfileData {
  access_token: string,
}



export default function MultiStepProfileForm(props: MultiStepProfileFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSubscribed } = useSubscriptionContext()
  const [currentStep, setCurrentStep] = useState(0)
  const [companies, setCompanies] = useState<CompanyWithImageUrl[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [isEvaluationExpanded, setIsEvaluationExpanded] = useState(false)
  const [repositoryUrl, setRepositoryUrl] = useState(props.evaluation_url || '')

  useEffect(() => {
    if (!isSubscribed) {
      router.push("/"); 
    }
  }, [isSubscribed, router]);

  // Read step from URL parameter on component mount
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam !== null) {
      const step = parseInt(stepParam, 10);
      if (step >= 0 && step <= 3) {
        setCurrentStep(step);
        // Load companies if navigating directly to step 2
        if (step === 2 && companies.length === 0) {
          loadCompanies();
        }
      }
    }
  }, [searchParams, companies.length]);

  // Update URL when step changes
  const updateStep = (step: number) => {
    setCurrentStep(step);
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', step.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const [form, setForm] = useState<ProfileFormState>({
    id: props.id,
    email: props.email,
    first_name: props.first_name || "",
    last_name: props.last_name || "",
    linkedin_url: props.linkedin_url || "",
    resume_url: props.resume_url || "",
    personal_website: props.personal_website || "",
    phone_number: props.phone_number || "",
    resume_file: null,
    profile_image_url: props.profile_image_url || null,
    profile_image: null,
    bio: props.bio || "",
    is_public_profile: props.is_public_profile || false,
    newsletter_opt_in: props.newsletter_opt_in || false,
    status: props.status || "",
  });

  console.log("PROFILE FORM STATUS ", form.status)

  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load companies for step 2 (same query as companies page, limited to 20)


  const loadCompanies = async () => {
    setLoadingCompanies(true)
    try {
        const response = await fetch('/api/companies')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch companies: ${response.status}`)
        }
        
        const companies = await response.json()
        
        console.log('Companies fetched from API:', companies.length, companies)
        setCompanies(companies)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }



  async function urlToFile(url: string, filename: string, mimeType?: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType || blob.type });
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setLoading(true)

    try {
      // Validate required fields (same as original form)
      if (!form.first_name) {
        setFormError("First name is required.");
        return;
      }
      if (!form.last_name) {
        setFormError("Last name is required.");
        return;
      }
      if (!form.phone_number) {
        setFormError("Phone number is required.");
        return;
      }
      if (!form.linkedin_url) {
        setFormError("LinkedIn URL is required.");
        return;
      }
      if (!form.bio) {
        setFormError("Bio is required.");
        return;
      }

      // Build form data (same as original form)
      const formData = new FormData();
      formData.append('id', form.id.toString());
      formData.append('first_name', form.first_name);
      formData.append('last_name', form.last_name);
      formData.append('linkedin_url', form.linkedin_url);
      formData.append('personal_website', form.personal_website);
      formData.append('phone_number', form.phone_number);
      formData.append('email', form.email);
      formData.append('bio', form.bio);
      formData.append('is_public_profile', form.is_public_profile.toString());
      formData.append('newsletter_opt_in', form.newsletter_opt_in.toString());
      
      // Handle resume file (same logic as original form)
      let resumeFile: File | null = form.resume_file ?? null;
      if (!resumeFile && form.resume_url) {
        const filename = form.resume_url.split('/').pop() || 'resume.pdf';
        resumeFile = await urlToFile(form.resume_url, filename);
      }
      if (!resumeFile) {
        setFormError('Resume is required.');
        return;
      }
      formData.append('resume_file', resumeFile);

      // Handle profile image (same logic as original form)
      let profileImageFile: File | null = form.profile_image ?? null;
      if (!profileImageFile && form.profile_image_url) {
        const filename = form.profile_image_url.split('/').pop() || 'profile.jpg';
        profileImageFile = await urlToFile(form.profile_image_url, filename);
      }
      if (!profileImageFile) {
        setFormError('Profile image is required.');
        return;
      }
      formData.append('profile_image', profileImageFile);

      // Make request (same as original form)
      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${props.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        // Profile saved successfully, move to step 2
        updateStep(2)
        await loadCompanies()
      } else {
        setFormError('Update failed, check your fields!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setFormError('An unexpected error occurred.');
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Complete = async () => {
    if (!repositoryUrl.trim()) {
      setFormError('Please enter a repository URL before submitting.');
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      // Create FormData to update profile with evaluation
      const formData = new FormData();
      formData.append('id', form.id.toString());
      formData.append('email', form.email);
      formData.append('status', 'APPLICANT')
      formData.append('evaluation_url', repositoryUrl.trim());

      const response = await fetch('/api/post_evaluation', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${props.access_token}`,
        },
        body: formData
      });

      if (response.ok) {
        setFormSuccess(true);
      } else {
        setFormError("Evaluation submission failed");
      }
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <button 
            onClick={() => updateStep(0)}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${
              currentStep >= 0 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            0
          </button>
          <div className={`h-1 w-16 ${currentStep >= 1 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          <button 
            onClick={() => updateStep(1)}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${
              currentStep >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            1
          </button>
          <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          <button 
            onClick={() => {
              updateStep(2)
              if (companies.length === 0) {
                loadCompanies()
              }
            }}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${
              currentStep >= 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            2
          </button>
          <div className={`h-1 w-16 ${currentStep >= 3 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          <button 
            onClick={() => updateStep(3)}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${
              currentStep >= 3 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            3
          </button>
        </div>
      </div>

      {currentStep === 0 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2 flex items-center justify-center gap-3">
              welcome to the niche
              <span className="inline-block px-3 py-1 text-sm font-bold text-white bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-lg animate-pulse">
                BETA
              </span>
            </h2>
            <p className="text-neutral-600">set up your profile to start using the platform</p>
          </div>

          <div className="space-y-6 mx-12 md:mx-24 lg:mx-32">
            <div className="bg-gradient-to-r from-yellow-50 via-pink-50 to-blue-50 border border-neutral-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">the steps: </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <h4 className="text-lg font-bold text-neutral-700">basic profile information</h4>
                    <p className="text-lg text-neutral-600">share some basics about yourself and create your bio </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <h4 className="text-lg font-bold text-neutral-700">index on your interests</h4>
                    <p className="text-lg text-neutral-600">browse a set of ten partner companies and bookmark ones that particularly interest you so that we get a better understanding of your interests</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <h4 className="text-lg font-bold text-neutral-700">highlight your abilities</h4>
                    <p className="text-lg text-neutral-600">to get connected with partner startups, you will need to complete a short evaluation of your skills completely customized to your strengths. this will be a two to three hour project and you can do it once or as many times as you would prefer! we use this to filter and determine if you would be a good fit for a particular startup. as part of The Niche, you will be categorized into one of three statuses: 
                    <br /><br />
                    <strong>VIEWER</strong> means you can peruse and access The Niche. 
                    <br /><br />
                    <strong>APPLICANT</strong> means you have finished the evaluation and can apply to partner startups with our filters in place to ensure that the partner startup is a good fit 
                    <br /><br />
                    <strong>COHORT</strong> means that you have performed exceptionally in your evaluation, and you may reach out to any startup without our filters (+ other perks moving forward)
                    </p>
                  </div>
                </div>
              </div>
            </div>


            <div className="flex justify-end">
              <Button 
                onClick={() => updateStep(1)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">basic information</h2>
            <p className="text-neutral-600">tell us about yourself to get started</p>
          </div>

          <form onSubmit={handleStep1Submit} className="space-y-6">
            <ProfileInfo form={form} setForm={setForm} />
            
            {formError && (
              <Alert className="border-red-200 bg-red-50">
                <Terminal className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">{formError}</AlertTitle>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button 
                onClick={() => updateStep(0)}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-900 px-8 py-2"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2"
              >
                {loading ? 'Saving...' : 'Next'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">index on your interests</h2>
            <p className="text-neutral-600"><strong>bookmark</strong> a couple companies in this list that particularly interest you so that we get a better understanding of your interests</p>
          </div>

          <div className="space-y-4">
            {loadingCompanies ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
                <p className="mt-2 text-neutral-600">Loading companies...</p>
              </div>
            ) : (
              <>
                {companies.length > 0 ? (
                  <CompanyCards companies={companies} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-600">No companies available at the moment.</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-between items-center mt-8">
            <Button 
              onClick={() => updateStep(1)}
              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-900 px-8 py-2"
            >
              Back
            </Button>
            <Button 
              onClick={() => updateStep(3)}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">highlight your abilities</h2>
            <p className="text-neutral-600">learn about our evaluation process</p>
          </div>

          <div className="space-y-6 mx-12 md:mx-24 lg:mx-32">
            <div className="bg-gradient-to-r from-yellow-50 via-pink-50 to-blue-50 border border-neutral-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">instructions</h3>
              <div className="space-y-4">
                <p className="text-lg text-neutral-600">
                  we want to have a wholistic representation of your skills and abilities so that when we make the connect to startups that you are interested in, we can provide meaningful matches to both parties. to get connected with our partner startups, you must complete a <strong>customized evaluation</strong> designed specifically to highlight your background and skillset because it follows a &ldquo;pick your own adventure&rdquo; model.
                </p>
                <p className="text-lg text-neutral-600">
                  this is a <strong>2-3 hour project</strong> that showcases your abilities in a real-world context. you can complete it as many times as you&rsquo;d like via different avenues to showcase different parts of your skillset. 
                </p>
                
                <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-lg text-neutral-700">
                    <strong>📣 timeline:</strong> you will want to have this evaluation completed within 2 weeks of receiving access to our public beta. without the evaluation, you will not be able to connect directly to our startups. you can access this page whenever during that period. 
                  </p>
                </div>

                <hr className="my-6 border-neutral-200" />

                <div className="space-y-4">
                  <button
                    onClick={() => setIsEvaluationExpanded(!isEvaluationExpanded)}
                    className="flex items-center justify-between w-full p-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
                  >
                    <span className="text-lg font-bold text-neutral-800">📋 the evaluation</span>
                    <svg 
                      className={`w-5 h-5 text-neutral-600 transition-transform ${isEvaluationExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isEvaluationExpanded && (
                    <div className="space-y-4 p-4 bg-white border border-neutral-200 rounded-lg">
                      <p className="text-lg text-neutral-600">
                        take what you know about The Niche and your journey getting onboarded to the platform.
                      </p>
                      
                      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                        <p className="text-lg font-bold text-neutral-800 mb-2">🙋🏻‍♀️ question: </p>
                        <p className="text-lg text-neutral-700">
                          what is the underlying value proposition of The Niche (from the perspective of both early talent and partner startups) in your honest opinion? if there isn&rsquo;t one, what could be the underlying value proposition? why? 
                        </p>
                      </div>

                      <p className="text-lg text-neutral-600">
                        consider how you would expand on this value proposition using particular skillset(s) that you want to highlight. <strong>use AI for this evaluation</strong>. if you are non-technical but more product-oriented for example, you might want to consider what interviews, PRDs, etc. you can come up with. Some technical example avenues you can go down but would also suggest you take some time to think of projects personalized to your skillset(s):
                      </p>

                      <div className="space-y-3">
                        <div className="border-l-4 border-neutral-300 pl-4">
                          <p className="text-lg text-neutral-600">
                            <strong>webscraper:</strong> that ingests resumes, transcripts, etc to auto-populate a candidate&#39;s personal information (school, gpa, companies worked at, etc) in a database that is queryable (would highly recommend researching storage technologies)
                          </p>
                        </div>
                        <div className="border-l-4 border-neutral-300 pl-4">
                          <p className="text-lg text-neutral-600">
                            <strong>algorithm:</strong> that takes characteristics of a candidate that partner companies particularly look out for (ex. school, classes, experience level, etc) and compares that to what a candidate is looking for (ex. industry/vertical, size of company - series a, b, c, d) to rank and surface matches - welcome all implementations (even call to an OpenAI API)
                          </p>
                        </div>
                        <div className="border-l-4 border-neutral-300 pl-4">
                          <p className="text-lg text-neutral-600">
                            <strong>mobile app:</strong> a mobile friendly app of The Niche with capabilities such as getting access and logging in, storing the candidates information in a database
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="text-lg font-bold text-neutral-800 mb-3">📤 submission instructions</h4>
                        <p className="text-lg text-neutral-600">
                          make your own repository on github and make your project public. once you&rsquo;re done with your implementation, attach the link to your repository below and click submit! once you submit you will be able to connect with our partner startups via the submit interest button on each company profile.
                        </p>
                        
                        <form className="mt-6" onSubmit={(e) => {
                          e.preventDefault();
                          if (repositoryUrl.trim()) {
                            console.log('Repository URL submitted:', repositoryUrl);
                            // Handle repository URL submission here
                          }
                        }}>
                          <label htmlFor="repository-url" className="block text-sm font-medium text-neutral-700 mb-2">
                            GitHub Repository URL
                          </label>
                          <Input
                            id="repository-url"
                            type="url"
                            required
                            value={repositoryUrl}
                            onChange={(e) => setRepositoryUrl(e.target.value)}
                            placeholder="https://github.com/yourusername/your-project"
                          />
                        </form>
                        <Button 
                          onClick={handleStep2Complete}
                          className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2 mt-4"
                        >
                          Submit
                        </Button>
                        <div className="mt-6">
                        {formSuccess && 
                            <Alert className="border-green-200 bg-green-50">
                              <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                              <AlertTitle className="text-green-800">
                                Evaluation submitted successfully! Feedback will be in your inbox in a week. You can now start connecting with startups and exploring opportunities.
                              </AlertTitle>
                            </Alert>}
                        </div>
                      </div>
                      
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                onClick={() => updateStep(2)}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-900 px-8 py-2"
              >
                Back
              </Button>
              <Button 
                onClick={() => router.push("/companies")}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-2"
              >
                Finish Setup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
