import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, Car, GraduationCap, Calendar,
  Phone, Mail, Award, ChevronLeft, ChevronRight,
  Grid3x3, LayoutGrid, Layers, Map, Sparkles, List,
  Table, BarChart3, Clock, Users, Download, Check, X, Pause
} from 'lucide-react';
import { generate50Candidates } from '@/data/generate-candidates';

// Generate 50 candidates
const sampleCandidates = generate50Candidates();

type CandidateStatus = 'pending' | 'approved' | 'kiv' | 'rejected';

const CandidateShowcaseDemo = () => {
  const [selectedView, setSelectedView] = useState('comparison');
  const [selectedCandidate, setSelectedCandidate] = useState<typeof sampleCandidates[0] | null>(null);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, CandidateStatus>>({});

  const updateCandidateStatus = (candidateId: string, status: CandidateStatus) => {
    setCandidateStatuses(prev => ({
      ...prev,
      [candidateId]: status
    }));
  };

  const getStatusBadge = (candidateId: string) => {
    const status = candidateStatuses[candidateId] || 'pending';
    const statusConfig = {
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-300' },
      kiv: { label: 'KIV', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-300' },
      pending: { label: 'Pending', className: 'bg-gray-100 text-gray-600 border-gray-300' }
    };
    return statusConfig[status];
  };

  // 1. Classic 4-Column Grid View
  const ClassicGridView = () => (
    <div className="py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sampleCandidates.map((candidate, idx) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
          >
            <Card className="hover:shadow-lg transition-all cursor-pointer h-full"
                  onClick={() => setSelectedCandidate(candidate)}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-3">
                  <img src={candidate.photo} alt={candidate.name} className="w-20 h-20 rounded-full border-2 border-blue-200" />
                  <div className="text-center w-full">
                    <div className="font-semibold truncate">{candidate.name}</div>
                    <div className="text-xs text-muted-foreground">{candidate.role}</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{candidate.rating}</span>
                    </div>
                  </div>
                  <div className="w-full space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{candidate.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      <span>{candidate.vehicle}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // 2. Detailed List View
  const DetailedListView = () => (
    <div className="py-6 space-y-3">
      {sampleCandidates.map((candidate, idx) => {
        const statusBadge = getStatusBadge(candidate.id);
        return (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.02 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedCandidate(candidate)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img src={candidate.photo} alt={candidate.name} className="w-16 h-16 rounded-full" />
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{candidate.name}</span>
                        <Badge className={`${statusBadge.className} border text-xs`}>{statusBadge.label}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{candidate.role}</div>
                    </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{candidate.rating}</span>
                    </div>
                    <div className="text-muted-foreground">{candidate.projects} projects</div>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{candidate.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      <span>{candidate.vehicle}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 2).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )})}
    </div>
  );

  // 3. Bento Grid View
  const BentoGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4">
      {/* Featured - Large Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="md:col-span-5 md:row-span-2"
      >
        <Card className="h-full bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:shadow-2xl transition-shadow cursor-pointer"
              onClick={() => setSelectedCandidate(sampleCandidates[0])}>
          <CardHeader>
            <Badge className="w-fit bg-yellow-400 text-black">⭐ Featured Lead</Badge>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <img src={sampleCandidates[0].photo} alt={sampleCandidates[0].name} className="w-32 h-32 rounded-full border-4 border-white" />
            <div className="text-center">
              <h3 className="text-2xl font-bold">{sampleCandidates[0].name}</h3>
              <p className="text-lg">{sampleCandidates[0].role}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 font-bold">{sampleCandidates[0].rating}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {sampleCandidates[0].skills.slice(0, 3).map(skill => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="md:col-span-3"
      >
        <Card className="h-full bg-gradient-to-br from-green-400 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <div className="text-4xl font-bold">{sampleCandidates.length}</div>
                <div className="text-sm">Total Staff</div>
              </div>
              <div>
                <div className="text-3xl font-bold">4.7</div>
                <div className="text-sm">Avg Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold">42/50</div>
                <div className="text-sm">With Vehicles</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="md:col-span-4"
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm">Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>All in Klang Valley</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Avg: Diploma/Degree</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Avg Experience: 14 projects</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid of other candidates */}
      {sampleCandidates.slice(1, 13).map((candidate, idx) => (
        <motion.div
          key={candidate.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * (idx + 2) }}
          className="md:col-span-3"
        >
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedCandidate(candidate)}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-2">
                <img src={candidate.photo} alt={candidate.name} className="w-16 h-16 rounded-full" />
                <div className="text-center">
                  <div className="font-semibold">{candidate.name}</div>
                  <div className="text-xs text-muted-foreground">{candidate.role}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{candidate.rating}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  // 4. Cinematic Carousel View
  const CinematicCarouselView = () => {
    const currentCandidate = sampleCandidates[currentCarouselIndex];
    const statusBadge = getStatusBadge(currentCandidate.id);

    return (
      <div className="relative min-h-[700px] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 sm:p-8 rounded-lg my-4">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
          }} />
        </div>

        {/* Left Navigation Button */}
        <Button
          variant="ghost"
          size="icon"
          disabled={currentCarouselIndex === 0}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 active:bg-white/30 z-50 w-16 h-16 rounded-full backdrop-blur-md border-2 border-white/40 shadow-2xl transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentCarouselIndex((prev) => Math.max(0, prev - 1));
          }}
        >
          <ChevronLeft className="w-8 h-8 stroke-[3]" />
        </Button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentCarouselIndex}
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="max-w-5xl w-full relative z-10"
          >
            <Card className="bg-white/95 backdrop-blur-xl border-none shadow-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Large Photo with Status */}
                  <div className="flex-shrink-0">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
                      <img
                        src={currentCandidate.photo}
                        alt={currentCandidate.name}
                        className="relative w-72 h-72 rounded-2xl object-cover border-4 border-white shadow-2xl"
                      />
                      <div className={`absolute -bottom-3 -right-3 w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                        statusBadge.label === 'Approved' ? 'bg-green-500' :
                        statusBadge.label === 'KIV' ? 'bg-yellow-500' :
                        statusBadge.label === 'Rejected' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`}>
                        {statusBadge.label === 'Approved' && <Check className="w-6 h-6 text-white" />}
                        {statusBadge.label === 'KIV' && <Pause className="w-6 h-6 text-white" />}
                        {statusBadge.label === 'Rejected' && <X className="w-6 h-6 text-white" />}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {currentCandidate.name}
                        </h2>
                        <Badge className={`${statusBadge.className} border`}>{statusBadge.label}</Badge>
                      </div>
                      <p className="text-xl text-gray-600">{currentCandidate.role} • {currentCandidate.age} years old</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-7 h-7 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-3xl font-bold ml-2 text-gray-900">{currentCandidate.rating}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-500">Location</div>
                          <div className="font-semibold">{currentCandidate.location}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-purple-50 rounded-lg p-3">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="text-xs text-gray-500">Education</div>
                          <div className="font-semibold">{currentCandidate.education}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
                        <Car className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="text-xs text-gray-500">Vehicle</div>
                          <div className="font-semibold">{currentCandidate.vehicle}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-orange-50 rounded-lg p-3">
                        <Award className="w-5 h-5 text-orange-600" />
                        <div>
                          <div className="text-xs text-gray-500">Experience</div>
                          <div className="font-semibold">{currentCandidate.projects} Projects</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 text-gray-700">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentCandidate.skills.map(skill => (
                          <Badge key={skill} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 text-gray-700">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentCandidate.languages.map(lang => (
                          <Badge key={lang} variant="outline" className="border-2">{lang}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        size="lg"
                        className={candidateStatuses[currentCandidate.id] === 'approved'
                          ? 'flex-1 bg-green-600 hover:bg-green-700'
                          : 'flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-300'}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCandidateStatus(currentCandidate.id, 'approved');
                        }}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="lg"
                        className={candidateStatuses[currentCandidate.id] === 'kiv'
                          ? 'flex-1 bg-yellow-600 hover:bg-yellow-700'
                          : 'flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-2 border-yellow-300'}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCandidateStatus(currentCandidate.id, 'kiv');
                        }}
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        KIV
                      </Button>
                      <Button
                        size="lg"
                        className={candidateStatuses[currentCandidate.id] === 'rejected'
                          ? 'flex-1 bg-red-600 hover:bg-red-700'
                          : 'flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-300'}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCandidateStatus(currentCandidate.id, 'rejected');
                        }}
                      >
                        <X className="w-5 h-5 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Right Navigation Button */}
        <Button
          variant="ghost"
          size="icon"
          disabled={currentCarouselIndex === sampleCandidates.length - 1}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 active:bg-white/30 z-50 w-16 h-16 rounded-full backdrop-blur-md border-2 border-white/40 shadow-2xl transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentCarouselIndex((prev) => Math.min(sampleCandidates.length - 1, prev + 1));
          }}
        >
          <ChevronRight className="w-8 h-8 stroke-[3]" />
        </Button>

        {/* Modern Progress Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-xl">
            <button
              onClick={() => setCurrentCarouselIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentCarouselIndex === 0}
              className="text-white hover:text-blue-300 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2 items-center">
              {sampleCandidates.slice(0, Math.min(10, sampleCandidates.length)).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentCarouselIndex(idx)}
                  className="group relative"
                  title={`Go to candidate ${idx + 1}`}
                >
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentCarouselIndex
                      ? 'bg-white w-8'
                      : 'bg-white/40 hover:bg-white/60 group-hover:w-3'
                  }`} />
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentCarouselIndex((prev) => Math.min(sampleCandidates.length - 1, prev + 1))}
              disabled={currentCarouselIndex === sampleCandidates.length - 1}
              className="text-white hover:text-blue-300 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="absolute top-6 right-6 z-50 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-sm font-semibold shadow-xl">
          {currentCarouselIndex + 1} / {sampleCandidates.length}
        </div>
      </div>
    );
  };

  // 5. Masonry/Pinterest View
  const MasonryView = () => (
    <div className="py-4">
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {sampleCandidates.map((candidate, idx) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            className="break-inside-avoid"
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer mb-4"
                  onClick={() => setSelectedCandidate(candidate)}>
              <CardContent className="p-4">
                <img
                  src={candidate.photo}
                  alt={candidate.name}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
                <h3 className="font-semibold text-lg">{candidate.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{candidate.role}</p>

                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{candidate.rating}</span>
                </div>

                {/* Variable content for masonry effect */}
                {idx % 3 === 0 && (
                  <div className="space-y-2 mb-2">
                    <p className="text-sm italic text-muted-foreground">
                      "Outstanding performance in previous {candidate.projects} projects"
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 2).map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                  ))}
                </div>

                {idx % 2 === 0 && (
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Car className="w-3 h-3" />
                      <span>{candidate.vehicle}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // 6. Kanban Board by Role
  const KanbanView = () => {
    const roleGroups = sampleCandidates.reduce((acc, candidate) => {
      if (!acc[candidate.role]) acc[candidate.role] = [];
      acc[candidate.role].push(candidate);
      return acc;
    }, {} as Record<string, typeof sampleCandidates>);

    return (
      <div className="py-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {Object.entries(roleGroups).map(([role, candidates], roleIdx) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: roleIdx * 0.1 }}
              className="flex-shrink-0 w-72"
            >
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{role}</span>
                    <Badge variant="secondary">{candidates.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 max-h-[600px] overflow-y-auto">
                  {candidates.map((candidate) => (
                    <Card
                      key={candidate.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <img src={candidate.photo} alt={candidate.name} className="w-12 h-12 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{candidate.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{candidate.rating}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // 7. Timeline View
  const TimelineView = () => (
    <div className="py-6 max-w-4xl mx-auto">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200" />

        {sampleCandidates.slice(0, 20).map((candidate, idx) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative pl-20 pb-8"
          >
            {/* Timeline dot */}
            <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow" />

            <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedCandidate(candidate)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img src={candidate.photo} alt={candidate.name} className="w-16 h-16 rounded-full" />
                  <div className="flex-1">
                    <div className="font-semibold">{candidate.name}</div>
                    <div className="text-sm text-muted-foreground">{candidate.role}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{candidate.rating}</span>
                      <span>•</span>
                      <Award className="w-3 h-3" />
                      <span>{candidate.projects} projects</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 2).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // 8. Comparison Table
  const ComparisonTableView = () => (
    <div className="w-full py-6">
      <div className="overflow-x-auto">
      <Card className="border-none shadow-lg">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Candidate</th>
                <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                <th className="text-left p-4 font-semibold text-gray-700">Rating</th>
                <th className="text-left p-4 font-semibold text-gray-700">Experience</th>
                <th className="text-left p-4 font-semibold text-gray-700">Location</th>
                <th className="text-left p-4 font-semibold text-gray-700">Vehicle</th>
                <th className="text-left p-4 font-semibold text-gray-700">Languages</th>
                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sampleCandidates.map((candidate, idx) => {
                const statusBadge = getStatusBadge(candidate.id);
                return (
                  <motion.tr
                    key={candidate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    className="border-b hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={candidate.photo} alt={candidate.name} className="w-12 h-12 rounded-full ring-2 ring-blue-100" />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            statusBadge.label === 'Approved' ? 'bg-green-500' :
                            statusBadge.label === 'KIV' ? 'bg-yellow-500' :
                            statusBadge.label === 'Rejected' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{candidate.name}</div>
                          <Badge className={`${statusBadge.className} border text-xs mt-1`}>{statusBadge.label}</Badge>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="font-normal">{candidate.role}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">{candidate.rating}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span>{candidate.projects} projects</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{candidate.location}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span>{candidate.vehicle}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {candidate.languages.slice(0, 2).map(lang => (
                          <Badge key={lang} variant="secondary" className="text-xs">{lang}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={candidateStatuses[candidate.id] === 'approved' ? 'default' : 'ghost'}
                          className={candidateStatuses[candidate.id] === 'approved' ? 'bg-green-600 hover:bg-green-700 h-8 w-8 p-0' : 'hover:bg-green-50 h-8 w-8 p-0'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCandidateStatus(candidate.id, 'approved');
                          }}
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={candidateStatuses[candidate.id] === 'kiv' ? 'default' : 'ghost'}
                          className={candidateStatuses[candidate.id] === 'kiv' ? 'bg-yellow-600 hover:bg-yellow-700 h-8 w-8 p-0' : 'hover:bg-yellow-50 h-8 w-8 p-0'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCandidateStatus(candidate.id, 'kiv');
                          }}
                          title="KIV"
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={candidateStatuses[candidate.id] === 'rejected' ? 'default' : 'ghost'}
                          className={candidateStatuses[candidate.id] === 'rejected' ? 'bg-red-600 hover:bg-red-700 h-8 w-8 p-0' : 'hover:bg-red-50 h-8 w-8 p-0'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCandidateStatus(candidate.id, 'rejected');
                          }}
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      </div>
    </div>
  );

  // 9. Instagram Stories Style
  const StoriesView = () => {
    const [currentStory, setCurrentStory] = useState(0);
    const candidate = sampleCandidates[currentStory];
    const statusBadge = getStatusBadge(candidate.id);

    return (
      <div className="flex items-center justify-center min-h-[700px] bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4 rounded-lg my-4">
        <div className="relative max-w-md w-full">
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
            {sampleCandidates.slice(0, 10).map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: idx === currentStory ? '100%' : idx < currentStory ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="aspect-[9/16] relative"
            >
              <Card className="h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white border-none shadow-2xl overflow-hidden">
                <CardContent className="h-full flex flex-col justify-between p-0 relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
                      backgroundSize: '50px 50px'
                    }} />
                  </div>

                  {/* Header */}
                  <div className="relative z-10 p-6 pt-12">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={candidate.photo} alt={candidate.name} className="w-14 h-14 rounded-full border-3 border-white shadow-lg" />
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                            statusBadge.label === 'Approved' ? 'bg-green-500' :
                            statusBadge.label === 'KIV' ? 'bg-yellow-500' :
                            statusBadge.label === 'Rejected' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                        </div>
                        <div>
                          <div className="font-bold text-lg">{candidate.name}</div>
                          <div className="text-sm opacity-90 flex items-center gap-2">
                            {candidate.role}
                            <Badge className={`${statusBadge.className} border text-xs`}>{statusBadge.label}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Image */}
                  <div className="relative z-10 flex-1 flex items-center justify-center py-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl" />
                      <img src={candidate.photo} alt={candidate.name} className="relative w-56 h-56 rounded-full border-4 border-white shadow-2xl" />
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="relative z-10 p-6 space-y-4 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 fill-yellow-300 text-yellow-300" />
                      ))}
                      <span className="text-2xl font-bold ml-2">{candidate.rating}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{candidate.location}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <Award className="w-4 h-4" />
                        <span>{candidate.projects} Projects</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <GraduationCap className="w-4 h-4" />
                        <span>{candidate.education}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <Car className="w-4 h-4" />
                        <span className="truncate">{candidate.vehicle}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {candidate.skills.slice(0, 3).map(skill => (
                        <Badge key={skill} className="bg-white/20 border-white/30 backdrop-blur-sm">{skill}</Badge>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="lg"
                        className={candidateStatuses[candidate.id] === 'approved'
                          ? 'flex-1 bg-green-500 hover:bg-green-600 border-2 border-white'
                          : 'flex-1 bg-white/10 hover:bg-white/20 border-2 border-white/30 backdrop-blur-sm'}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCandidateStatus(candidate.id, 'approved');
                        }}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="lg"
                        className={candidateStatuses[candidate.id] === 'kiv'
                          ? 'flex-1 bg-yellow-500 hover:bg-yellow-600 border-2 border-white'
                          : 'flex-1 bg-white/10 hover:bg-white/20 border-2 border-white/30 backdrop-blur-sm'}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCandidateStatus(candidate.id, 'kiv');
                        }}
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        KIV
                      </Button>
                      <Button
                        size="lg"
                        className={candidateStatuses[candidate.id] === 'rejected'
                          ? 'flex-1 bg-red-500 hover:bg-red-600 border-2 border-white'
                          : 'flex-1 bg-white/10 hover:bg-white/20 border-2 border-white/30 backdrop-blur-sm'}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCandidateStatus(candidate.id, 'rejected');
                        }}
                      >
                        <X className="w-5 h-5 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <button
            onClick={() => setCurrentStory((prev) => Math.max(0, prev - 1))}
            disabled={currentStory === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => setCurrentStory((prev) => Math.min(sampleCandidates.length - 1, prev + 1))}
            disabled={currentStory === sampleCandidates.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
            {currentStory + 1} / {sampleCandidates.length}
          </div>
        </div>
      </div>
    );
  };

  // 10. Split View
  const SplitView = () => {
    const [splitSelected, setSplitSelected] = useState(sampleCandidates[0]);

    return (
      <div className="flex h-[600px]">
        {/* Left: List */}
        <div className="w-1/3 border-r overflow-y-auto">
          {sampleCandidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => setSplitSelected(candidate)}
              className={`p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors ${
                splitSelected.id === candidate.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <img src={candidate.photo} alt={candidate.name} className="w-12 h-12 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{candidate.name}</div>
                  <div className="text-sm text-muted-foreground">{candidate.role}</div>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{candidate.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Detail */}
        <div className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={splitSelected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-start gap-6 mb-6">
                <img src={splitSelected.photo} alt={splitSelected.name} className="w-32 h-32 rounded-full border-4 border-blue-500" />
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{splitSelected.name}</h2>
                  <p className="text-xl text-muted-foreground mb-4">{splitSelected.role}, {splitSelected.age}</p>
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-2xl font-bold ml-2">{splitSelected.rating}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Location</label>
                  <p className="text-lg">{splitSelected.location}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Education</label>
                  <p className="text-lg">{splitSelected.education}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Vehicle</label>
                  <p className="text-lg">{splitSelected.vehicle}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Experience</label>
                  <p className="text-lg">{splitSelected.projects} projects</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {splitSelected.skills.map(skill => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {splitSelected.languages.map(lang => (
                      <Badge key={lang} variant="outline">{lang}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">Contact</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{splitSelected.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{splitSelected.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // 11. Compact Table
  const CompactTableView = () => (
    <div className="w-full py-6">
      <div className="overflow-x-auto">
      <Card className="border-none shadow-lg">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="bg-gradient-to-r from-slate-50 to-gray-50 border-b-2 border-slate-200">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700">#</th>
                <th className="text-left p-3 font-semibold text-gray-700">Name</th>
                <th className="text-left p-3 font-semibold text-gray-700">Role</th>
                <th className="text-left p-3 font-semibold text-gray-700">Rating</th>
                <th className="text-left p-3 font-semibold text-gray-700">Projects</th>
                <th className="text-left p-3 font-semibold text-gray-700">Location</th>
                <th className="text-left p-3 font-semibold text-gray-700">Vehicle</th>
                <th className="text-left p-3 font-semibold text-gray-700">Education</th>
                <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sampleCandidates.map((candidate, idx) => {
                const statusBadge = getStatusBadge(candidate.id);
                return (
                  <motion.tr
                    key={candidate.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.005 }}
                    className="border-b hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 text-gray-600">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <img src={candidate.photo} alt={candidate.name} className="w-8 h-8 rounded-full ring-1 ring-slate-200" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                            statusBadge.label === 'Approved' ? 'bg-green-500' :
                            statusBadge.label === 'KIV' ? 'bg-yellow-500' :
                            statusBadge.label === 'Rejected' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                        </div>
                        <span className="font-semibold text-gray-900">{candidate.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs font-normal">{candidate.role}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{candidate.rating}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{candidate.projects}</td>
                    <td className="p-3 text-gray-600">{candidate.location}</td>
                    <td className="p-3 text-gray-600">{candidate.vehicle}</td>
                    <td className="p-3 text-gray-600">{candidate.education}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={candidateStatuses[candidate.id] === 'approved' ? 'default' : 'ghost'}
                          className={candidateStatuses[candidate.id] === 'approved' ? 'bg-green-600 hover:bg-green-700 h-7 w-7 p-0' : 'hover:bg-green-50 h-7 w-7 p-0'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCandidateStatus(candidate.id, 'approved');
                          }}
                          title="Approve"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant={candidateStatuses[candidate.id] === 'kiv' ? 'default' : 'ghost'}
                          className={candidateStatuses[candidate.id] === 'kiv' ? 'bg-yellow-600 hover:bg-yellow-700 h-7 w-7 p-0' : 'hover:bg-yellow-50 h-7 w-7 p-0'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCandidateStatus(candidate.id, 'kiv');
                          }}
                          title="KIV"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant={candidateStatuses[candidate.id] === 'rejected' ? 'default' : 'ghost'}
                          className={candidateStatuses[candidate.id] === 'rejected' ? 'bg-red-600 hover:bg-red-700 h-7 w-7 p-0' : 'hover:bg-red-50 h-7 w-7 p-0'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCandidateStatus(candidate.id, 'rejected');
                          }}
                          title="Reject"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      </div>
    </div>
  );

  // 12. 3D Card Stack
  const CardStackView = () => {
    const [stackIndex, setStackIndex] = useState(0);

    return (
      <div className="flex items-center justify-center min-h-[600px] py-8">
        <div className="relative w-full max-w-md h-[500px]">
          {sampleCandidates.slice(0, 10).map((candidate, idx) => {
            const offset = idx - stackIndex;
            const isActive = idx === stackIndex;

            return (
              <motion.div
                key={candidate.id}
                className="absolute inset-0"
                initial={false}
                animate={{
                  y: offset * 20,
                  scale: 1 - Math.abs(offset) * 0.05,
                  zIndex: 10 - Math.abs(offset),
                  opacity: Math.abs(offset) > 3 ? 0 : 1 - Math.abs(offset) * 0.2,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <Card className={`h-full ${isActive ? 'shadow-2xl' : 'shadow-md'}`}>
                  <CardContent className="h-full flex flex-col justify-between p-8">
                    <div className="flex items-center gap-4">
                      <img src={candidate.photo} alt={candidate.name} className="w-20 h-20 rounded-full border-4 border-blue-500" />
                      <div>
                        <h3 className="text-2xl font-bold">{candidate.name}</h3>
                        <p className="text-lg text-muted-foreground">{candidate.role}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-2xl font-bold ml-2">{candidate.rating}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-500" />
                          <span>{candidate.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-blue-500" />
                          <span>{candidate.education}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="w-5 h-5 text-blue-500" />
                          <span>{candidate.vehicle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-blue-500" />
                          <span>{candidate.projects} Projects</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center">
                        {candidate.skills.map(skill => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    {isActive && (
                      <div className="flex gap-3 justify-center mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setStackIndex((prev) => Math.max(0, prev - 1))}
                          disabled={stackIndex === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setStackIndex((prev) => Math.min(sampleCandidates.length - 1, prev + 1))}
                          disabled={stackIndex === sampleCandidates.length - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  // Action Buttons Component
  const ActionButtons = ({ candidateId, size = 'default' }: { candidateId: string, size?: 'default' | 'sm' }) => {
    const status = candidateStatuses[candidateId];

    return (
      <div className="flex gap-2">
        <Button
          size={size}
          variant={status === 'approved' ? 'default' : 'outline'}
          className={status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50'}
          onClick={(e) => {
            e.stopPropagation();
            updateCandidateStatus(candidateId, 'approved');
          }}
        >
          <Check className="w-4 h-4 mr-1" />
          Approve
        </Button>
        <Button
          size={size}
          variant={status === 'kiv' ? 'default' : 'outline'}
          className={status === 'kiv' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50'}
          onClick={(e) => {
            e.stopPropagation();
            updateCandidateStatus(candidateId, 'kiv');
          }}
        >
          <Pause className="w-4 h-4 mr-1" />
          KIV
        </Button>
        <Button
          size={size}
          variant={status === 'rejected' ? 'default' : 'outline'}
          className={status === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600 hover:bg-red-50'}
          onClick={(e) => {
            e.stopPropagation();
            updateCandidateStatus(candidateId, 'rejected');
          }}
        >
          <X className="w-4 h-4 mr-1" />
          Reject
        </Button>
      </div>
    );
  };

  // Modal for candidate details
  const CandidateDetailModal = () => {
    if (!selectedCandidate) return null;
    const statusBadge = getStatusBadge(selectedCandidate.id);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
           onClick={() => setSelectedCandidate(null)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <Card>
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setSelectedCandidate(null)}
              >
                ✕
              </Button>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={selectedCandidate.photo}
                  alt={selectedCandidate.name}
                  className="w-24 h-24 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-2xl">{selectedCandidate.name}</CardTitle>
                    <Badge className={`${statusBadge.className} border`}>{statusBadge.label}</Badge>
                  </div>
                  <p className="text-muted-foreground">{selectedCandidate.role}</p>
                </div>
              </div>
              <ActionButtons candidateId={selectedCandidate.id} />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Age</label>
                  <p>{selectedCandidate.age} years</p>
                </div>
                <div>
                  <label className="text-sm font-semibold">Rating</label>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{selectedCandidate.rating}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Education</label>
                  <p>{selectedCandidate.education}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold">Vehicle</label>
                  <p>{selectedCandidate.vehicle}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold">Location</label>
                  <p>{selectedCandidate.location}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold">Projects</label>
                  <p>{selectedCandidate.projects} completed</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Contact</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{selectedCandidate.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{selectedCandidate.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map(skill => (
                    <Badge key={skill}>{skill}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.languages.map(lang => (
                    <Badge key={lang} variant="secondary">{lang}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  };

  const views = [
    { id: 'comparison', name: 'Comparison Table', icon: Table, component: ComparisonTableView },
    { id: 'compact', name: 'Compact Table', icon: Table, component: CompactTableView },
    { id: 'stories', name: 'Instagram Stories', icon: Sparkles, component: StoriesView },
    { id: 'carousel', name: 'Cinematic Carousel', icon: Layers, component: CinematicCarouselView },
  ];

  const CurrentView = views.find(v => v.id === selectedView)?.component || ComparisonTableView;

  // Calculate status counts
  const statusCounts = {
    approved: Object.values(candidateStatuses).filter(s => s === 'approved').length,
    kiv: Object.values(candidateStatuses).filter(s => s === 'kiv').length,
    rejected: Object.values(candidateStatuses).filter(s => s === 'rejected').length,
    pending: sampleCandidates.length - Object.keys(candidateStatuses).length
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold">Candidate Showcase</h1>
                <p className="text-sm text-muted-foreground">{sampleCandidates.length} candidates • 4 design patterns</p>
                <div className="flex gap-3 mt-2">
                  <Badge className="bg-green-100 text-green-800 border-green-300 border">
                    <Check className="w-3 h-3 mr-1" />
                    {statusCounts.approved} Approved
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 border">
                    <Pause className="w-3 h-3 mr-1" />
                    {statusCounts.kiv} KIV
                  </Badge>
                  <Badge className="bg-red-100 text-red-800 border-red-300 border">
                    <X className="w-3 h-3 mr-1" />
                    {statusCounts.rejected} Rejected
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-600 border-gray-300 border">
                    {statusCounts.pending} Pending
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>

          {/* View Selector */}
          <div className="flex flex-wrap gap-2">
            {views.map(view => (
              <Button
                key={view.id}
                variant={selectedView === view.id ? 'default' : 'outline'}
                onClick={() => setSelectedView(view.id)}
                className="gap-2"
                size="sm"
              >
                <view.icon className="w-4 h-4" />
                {view.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CurrentView />
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCandidate && <CandidateDetailModal />}
      </AnimatePresence>
    </div>
  );
};

export default CandidateShowcaseDemo;
