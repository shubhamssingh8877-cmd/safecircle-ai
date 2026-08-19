import React, { useState } from 'react';
import {
  Plus,
  Phone,
  Mail,
  Trash2,
  Radio,
  Star,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';

export const ContactsPage: React.FC = () => {
  const { contacts, addContact, updateContact, deleteContact } = useJourney();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testPingSentId, setTestPingSentId] = useState<string | null>(null);

  // Add Contact Form State
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isPrimaryGuardian, setIsPrimaryGuardian] = useState(false);
  const [escalationTier, setEscalationTier] = useState<1 | 2 | 3>(2);
  const [notifyOnDeviation, setNotifyOnDeviation] = useState(true);
  const [notifyOnCheckinMissed, setNotifyOnCheckinMissed] = useState(true);
  const [notifyOnBatteryLow, setNotifyOnBatteryLow] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) return;

    addContact({
      name,
      relationship: relationship || 'Trusted Friend',
      phoneNumber,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      isPrimaryGuardian,
      escalationTier,
      notifyOnDeviation,
      notifyOnCheckinMissed,
      notifyOnBatteryLow,
    });

    // Reset
    setName('');
    setRelationship('');
    setPhoneNumber('');
    setEmail('');
    setIsPrimaryGuardian(false);
    setIsAddModalOpen(false);
  };

  const handleSendTestPing = (id: string) => {
    setTestPingSentId(id);
    setTimeout(() => {
      setTestPingSentId(null);
    }, 3000);
  };

  const setPrimaryGuardian = (contactId: string) => {
    contacts.forEach(c => {
      updateContact(c.id, { isPrimaryGuardian: c.id === contactId });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
              Trusted Circle Mesh
            </h2>
            <Badge variant="safe" size="sm">
              {contacts.length} Guardians Connected
            </Badge>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Define who gets notified during journey deviations, missed check-ins, or emergency escalation.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Trusted Guardian
        </Button>
      </div>

      {/* Escalation Tier Information Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-safe-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-900 dark:text-surface-100">
              Tier 1 • Browser Emergency Alert
            </h4>
          </div>
          <p className="text-xs text-surface-500 leading-relaxed">
            Native browser notification & Web Audio beacon. Dispatched instantly upon manual SOS or unacknowledged deviation.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-900 dark:text-surface-100">
              Tier 2 • Primary Guardian Call Ready
            </h4>
          </div>
          <p className="text-xs text-surface-500 leading-relaxed">
            Provides quick-dial <code>tel:</code> link to immediately ring your primary contact with one tap.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-900 dark:text-surface-100">
              Tier 3 • Emergency Services (911)
            </h4>
          </div>
          <p className="text-xs text-surface-500 leading-relaxed">
            Direct <code>tel:911</code> emergency call action with copied GPS snapshot coordinates.
          </p>
        </div>
      </div>

      {/* Contacts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map(contact => (
          <Card
            key={contact.id}
            className="flex flex-col justify-between"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {contact.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{contact.name}</CardTitle>
                      {contact.isPrimaryGuardian && (
                        <Badge variant="brand" size="sm">
                          Primary Guardian
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{contact.relationship}</CardDescription>
                  </div>
                </div>

                <Badge
                  variant={
                    contact.escalationTier === 1
                      ? 'brand'
                      : contact.escalationTier === 2
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  Tier {contact.escalationTier}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-200/60 dark:border-surface-800/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-surface-600 dark:text-surface-400">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {contact.phoneNumber}
                  </span>
                  <span className="font-mono text-[11px] text-surface-500">
                    {contact.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{contact.email}</span>
                </div>
              </div>

              {/* Notification Permission Badges */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {contact.notifyOnDeviation && (
                  <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium">
                    Route Deviations
                  </span>
                )}
                {contact.notifyOnCheckinMissed && (
                  <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium">
                    Missed Check-ins
                  </span>
                )}
                {contact.notifyOnBatteryLow && (
                  <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-medium">
                    Low Battery (&lt;15%)
                  </span>
                )}
              </div>

              {/* Action Controls */}
              <div className="pt-2 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!contact.isPrimaryGuardian && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrimaryGuardian(contact.id)}
                      icon={<Star className="w-3.5 h-3.5" />}
                    >
                      Set as Primary
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendTestPing(contact.id)}
                    icon={<Radio className="w-3.5 h-3.5" />}
                  >
                    {testPingSentId === contact.id ? 'Ping Dispatched!' : 'Send Test Ping'}
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => deleteContact(contact.id)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950 transition-colors"
                  title="Remove Guardian"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Guardian Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Trusted Guardian"
        description="Add a contact who will receive alerts during emergencies or unattended route deviations."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Maya Lin"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <Input
            label="Relationship"
            placeholder="e.g. Sister, Partner, Flatmate"
            value={relationship}
            onChange={e => setRelationship(e.target.value)}
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="guardian@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <Select
            label="Escalation Response Tier"
            value={String(escalationTier)}
            onChange={e => setEscalationTier(Number(e.target.value) as 1 | 2 | 3)}
            options={[
              { label: 'Tier 1 — Immediate SMS & Push Notification', value: '1' },
              { label: 'Tier 2 — Automated Urgent Phone Call', value: '2' },
              { label: 'Tier 3 — Campus Security / Dispatch Coordination', value: '3' },
            ]}
          />

          <div className="space-y-3 pt-2 border-t border-surface-200 dark:border-surface-800">
            <h4 className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Notification Triggers
            </h4>

            <Switch
              label="Notify on Route Deviation"
              description="Alert this guardian if you veer off track and don't respond."
              checked={notifyOnDeviation}
              onChange={setNotifyOnDeviation}
            />

            <Switch
              label="Notify on Missed Scheduled Check-in"
              description="Alert if automated check-in timer expires without confirmation."
              checked={notifyOnCheckinMissed}
              onChange={setNotifyOnCheckinMissed}
            />

            <Switch
              label="Notify on Critical Battery Level"
              description="Alert if device battery drops below 15% during an active journey."
              checked={notifyOnBatteryLow}
              onChange={setNotifyOnBatteryLow}
            />

            <Switch
              label="Set as Primary Guardian"
              description="Primary contact dialed during manual SOS and auto-escalation."
              checked={isPrimaryGuardian}
              onChange={setIsPrimaryGuardian}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Guardian
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
