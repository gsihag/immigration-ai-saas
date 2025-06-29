
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ClientEligibilityCheck: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    visaType: '',
    currentStatus: '',
    countryOfBirth: '',
    education: '',
    workExperience: '',
    englishProficiency: '',
    familyTies: '',
    criminalHistory: ''
  });
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock eligibility results based on form data
    const mockResults = {
      overall: 'High',
      score: 85,
      visaType: formData.visaType,
      recommendations: [
        {
          category: 'Education',
          status: 'strong',
          message: 'Your educational background meets the requirements'
        },
        {
          category: 'Work Experience',
          status: 'moderate',
          message: 'Additional work experience documentation may strengthen your case'
        },
        {
          category: 'English Proficiency',
          status: 'strong',
          message: 'Your English proficiency level is adequate'
        }
      ],
      nextSteps: [
        'Gather supporting documentation for your work experience',
        'Obtain official transcripts from educational institutions',
        'Prepare financial documentation showing adequate support'
      ],
      estimatedProcessingTime: '6-8 months',
      successProbability: '85%'
    };

    setResults(mockResults);
    setLoading(false);

    toast({
      title: "Eligibility Check Complete",
      description: "Your eligibility assessment has been generated successfully."
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'strong':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'moderate':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Eligibility Check</h2>
        <p className="text-muted-foreground">
          Check your eligibility for different visa programs with our AI-powered assessment
        </p>
      </div>

      {!results ? (
        <Card>
          <CardHeader>
            <CardTitle>Visa Eligibility Assessment</CardTitle>
            <CardDescription>
              Please provide the following information to assess your eligibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="visaType">Visa Type of Interest</Label>
                  <Select value={formData.visaType} onValueChange={(value) => setFormData({...formData, visaType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visa type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family-based">Family-Based Green Card</SelectItem>
                      <SelectItem value="employment-based">Employment-Based Green Card</SelectItem>
                      <SelectItem value="investor">Investor Visa (EB-5)</SelectItem>
                      <SelectItem value="student">Student Visa (F-1)</SelectItem>
                      <SelectItem value="work">Work Visa (H-1B)</SelectItem>
                      <SelectItem value="tourist">Tourist Visa (B-2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentStatus">Current Immigration Status</Label>
                  <Select value={formData.currentStatus} onValueChange={(value) => setFormData({...formData, currentStatus: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select current status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nonimmigrant">Non-immigrant visa holder</SelectItem>
                      <SelectItem value="pending">Pending status</SelectItem>
                      <SelectItem value="citizen">U.S. Citizen</SelectItem>
                      <SelectItem value="permanent">Permanent Resident</SelectItem>
                      <SelectItem value="undocumented">Undocumented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryOfBirth">Country of Birth</Label>
                  <Input
                    id="countryOfBirth"
                    placeholder="Enter your country of birth"
                    value={formData.countryOfBirth}
                    onChange={(e) => setFormData({...formData, countryOfBirth: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Highest Education Level</Label>
                  <Select value={formData.education} onValueChange={(value) => setFormData({...formData, education: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-school">High School</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="doctorate">Doctorate/PhD</SelectItem>
                      <SelectItem value="professional">Professional Degree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workExperience">Years of Work Experience</Label>
                  <Select value={formData.workExperience} onValueChange={(value) => setFormData({...formData, workExperience: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2">0-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="englishProficiency">English Proficiency</Label>
                  <Select value={formData.englishProficiency} onValueChange={(value) => setFormData({...formData, englishProficiency: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select proficiency level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="native">Native Speaker</SelectItem>
                      <SelectItem value="fluent">Fluent</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyTies">U.S. Family Ties</Label>
                  <Select value={formData.familyTies} onValueChange={(value) => setFormData({...formData, familyTies: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select family relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">U.S. Citizen Spouse</SelectItem>
                      <SelectItem value="parent">U.S. Citizen Parent</SelectItem>
                      <SelectItem value="child">U.S. Citizen Child</SelectItem>
                      <SelectItem value="sibling">U.S. Citizen Sibling</SelectItem>
                      <SelectItem value="none">No immediate family ties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criminalHistory">Criminal History</Label>
                  <Select value={formData.criminalHistory} onValueChange={(value) => setFormData({...formData, criminalHistory: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No criminal history</SelectItem>
                      <SelectItem value="minor">Minor offenses</SelectItem>
                      <SelectItem value="major">Major offenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Analyzing...' : 'Check My Eligibility'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Eligibility Assessment Results</span>
                <Badge className={`${getScoreColor(results.score)} px-3 py-1`}>
                  {results.score}% Match
                </Badge>
              </CardTitle>
              <CardDescription>
                Based on your responses for {results.visaType}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Overall Rating</h4>
                  <p className="text-2xl font-bold text-green-600">{results.overall}</p>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Success Probability</h4>
                  <p className="text-2xl font-bold">{results.successProbability}</p>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Processing Time</h4>
                  <p className="text-2xl font-bold">{results.estimatedProcessingTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Assessment</CardTitle>
              <CardDescription>
                Breakdown of your eligibility factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                    {getStatusIcon(rec.status)}
                    <div>
                      <h4 className="font-medium">{rec.category}</h4>
                      <p className="text-sm text-muted-foreground">{rec.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.nextSteps.map((step: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={() => setResults(null)} variant="outline">
              Check Another Visa Type
            </Button>
            <Button>
              Start Application Process
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
