import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileWarning,
  Plus,
  ThumbsUp,
  ShieldCheck,
  MapPin,
  Clock,
  Lightbulb,
  AlertTriangle,
  Bus,
  Construction,
  Search,
  Crosshair,
  Loader2,
  CheckCircle2,
  Map,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { SafetyReport } from '../types';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { reports, addSafetyReport, upvoteReport, upvotedReportIds } = useJourney();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // New Report Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<SafetyReport['category']>('lighting');
  const [formSeverity, setFormSeverity] = useState<SafetyReport['severity']>('advisory');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Geospatial coordinate state
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsAccuracy, setCoordsAccuracy] = useState<number | null>(null);
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const categoryIcons: Record<string, React.ReactNode> = {
    lighting: <Lightbulb className="w-4 h-4 text-warning-500" />,
    suspicious: <AlertTriangle className="w-4 h-4 text-danger-500" />,
    infrastructure: <Construction className="w-4 h-4 text-brand-500" />,
    transit: <Bus className="w-4 h-4 text-brand-400" />,
    harassment: <AlertTriangle className="w-4 h-4 text-danger-600" />,
  };

  const handleAcquireGpsLocation = () => {
    setIsAcquiringGps(true);
    setGpsError(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setIsAcquiringGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setSelectedCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setCoordsAccuracy(pos.coords.accuracy);
        setIsAcquiringGps(false);
        setGpsError(null);
      },
      err => {
        let msg = 'Failed to acquire GPS location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'GPS or network position information is currently unavailable.';
        }
        setGpsError(msg);
        setIsAcquiringGps(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const filteredReports = reports.filter(rep => {
    const matchesCategory = selectedCategory === 'all' || rep.category === selectedCategory;
    const matchesSearch =
      rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formLocation.trim() || !formDescription.trim()) return;

    if (!selectedCoords) {
      setGpsError('Please acquire your GPS location or select a location on the Risk Map before submitting.');
      return;
    }

    addSafetyReport({
      title: formTitle,
      category: formCategory,
      severity: formSeverity,
      location: formLocation,
      coordinates: {
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
      },
      description: formDescription,
    });

    // Reset and close
    setFormTitle('');
    setFormLocation('');
    setFormDescription('');
    setSelectedCoords(null);
    setCoordsAccuracy(null);
    setGpsError(null);
    setIsSubmitModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
              Community Safety Network
            </h2>
            <Badge variant="brand" size="sm">
              {reports.length} Active Observations
            </Badge>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Crowdsourced and municipal safety observations to keep solo walkers informed.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsSubmitModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Submit Safety Observation
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search hazards or locations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Incidents' },
            { id: 'lighting', label: 'Lighting' },
            { id: 'suspicious', label: 'Suspicious' },
            { id: 'infrastructure', label: 'Hazard/Road' },
            { id: 'transit', label: 'Transit' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === tab.id
                  ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 font-semibold'
                  : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map(report => {
          const isUpvoted = upvotedReportIds.includes(report.id);
          return (
            <Card key={report.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 shrink-0">
                      {categoryIcons[report.category] || <FileWarning className="w-4 h-4 text-surface-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold leading-snug">
                          {report.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-surface-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {report.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {report.timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={
                      report.severity === 'warning'
                        ? 'danger'
                        : report.severity === 'caution'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {report.severity.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
                  {report.description}
                </p>

                {report.coordinates && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-surface-400">
                    <Crosshair className="w-3 h-3" />
                    <span>
                      {report.coordinates.lat.toFixed(4)}° N, {report.coordinates.lng.toFixed(4)}° W
                    </span>
                  </div>
                )}

                {/* Footer metadata & actions */}
                <div className="pt-2 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-surface-500">
                    {report.verified ? (
                      <span className="flex items-center gap-1 text-safe-600 dark:text-safe-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {report.verifiedBy}
                      </span>
                    ) : (
                      <span className="text-surface-400">{report.verifiedBy}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => upvoteReport(report.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors border ${
                      isUpvoted
                        ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                        : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-100'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-brand-600' : ''}`} />
                    <span>{report.upvotes}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Safety Observation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Safety Observation"
        description="Contribute real-time safety telemetry to protect other travelers in this area."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Observation Title"
            placeholder="e.g. Broken streetlight on 4th Ave sidewalk"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Hazard Category"
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as any)}
              options={[
                { value: 'lighting', label: 'Lighting / Low Visibility' },
                { value: 'suspicious', label: 'Suspicious Activity' },
                { value: 'infrastructure', label: 'Broken Sidewalk / Construction' },
                { value: 'transit', label: 'Transit Stop Concern' },
                { value: 'harassment', label: 'Harassment / Safety Concern' },
              ]}
            />

            <Select
              label="Severity"
              value={formSeverity}
              onChange={e => setFormSeverity(e.target.value as any)}
              options={[
                { value: 'advisory', label: 'Advisory (General Information)' },
                { value: 'caution', label: 'Caution (Moderate Caution)' },
                { value: 'warning', label: 'Warning (Avoid Corridor)' },
              ]}
            />
          </div>

          <Input
            label="Location Description"
            placeholder="e.g. 4th Ave between Market & Mission"
            value={formLocation}
            onChange={e => setFormLocation(e.target.value)}
            required
          />

          {/* GPS Coordinates Capture Box */}
          <div className="space-y-2 p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-900 dark:text-surface-100">
                Geographic Pin Coordinates
              </span>
              {selectedCoords && (
                <span className="text-[10px] text-safe-600 dark:text-safe-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  GPS Attached
                </span>
              )}
            </div>

            {selectedCoords ? (
              <div className="flex items-center justify-between text-xs font-mono bg-white dark:bg-surface-900 p-2 rounded-lg border border-surface-200 dark:border-surface-800">
                <span>
                  {selectedCoords.lat.toFixed(5)}° N, {selectedCoords.lng.toFixed(5)}° W
                </span>
                {coordsAccuracy && (
                  <span className="text-[10px] text-surface-400 font-sans">
                    ±{Math.round(coordsAccuracy)}m
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-surface-500">
                Attach real GPS coordinates so this observation alerts travelers along this corridor.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAcquireGpsLocation}
                disabled={isAcquiringGps}
                icon={isAcquiringGps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
              >
                {isAcquiringGps ? 'Acquiring GPS...' : 'Use My Current GPS Location'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSubmitModalOpen(false);
                  navigate('/risk-map');
                }}
                icon={<Map className="w-3.5 h-3.5" />}
              >
                Select on Risk Map
              </Button>
            </div>

            {gpsError && (
              <p className="text-xs text-danger-600 dark:text-danger-400">{gpsError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Detailed Description
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Describe what you observed so nearby travelers and guardians can take precautions..."
              className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 text-xs p-3 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
