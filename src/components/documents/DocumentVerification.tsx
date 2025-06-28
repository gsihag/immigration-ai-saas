
import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, FileText, Loader2 } from 'lucide-react';

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  verification_status: string;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  client?: {
    user?: {
      first_name: string | null;
      last_name: string | null;
    };
  };
}

interface DocumentVerificationProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: () => void;
}

export const DocumentVerification: React.FC<DocumentVerificationProps> = ({
  document,
  isOpen,
  onClose,
  onVerificationComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<string>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (document) {
      setVerificationStatus(document.verification_status || 'pending');
      setRejectionReason(document.rejection_reason || '');
      setVerificationNotes('');
    }
  }, [document]);

  const handleVerification = async () => {
    if (!document) return;

    setSubmitting(true);
    try {
      const updateData: any = {
        verification_status: verificationStatus,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (verificationStatus === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      if (verificationNotes) {
        updateData.notes = verificationNotes;
      }

      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', document.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Document ${verificationStatus === 'verified' ? 'verified' : 'marked for review'} successfully.`
      });

      onVerificationComplete();
      onClose();
    } catch (error) {
      console.error('Error updating document verification:', error);
      toast({
        title: "Error",
        description: "Failed to update document verification.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  const formatDocumentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Verification
          </DialogTitle>
          <DialogDescription>
            Review and verify the uploaded document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Information */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{document.file_name}</h3>
                {getStatusBadge(document.verification_status)}
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Type:</strong> {formatDocumentType(document.document_type)}</p>
                <p><strong>Client:</strong> {document.client?.user?.first_name} {document.client?.user?.last_name}</p>
                <p><strong>Uploaded:</strong> {new Date(document.created_at).toLocaleDateString()}</p>
                {document.notes && (
                  <p><strong>Notes:</strong> {document.notes}</p>
                )}
                {document.rejection_reason && (
                  <p><strong>Previous Rejection Reason:</strong> {document.rejection_reason}</p>
                )}
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="space-y-2">
            <Label htmlFor="verification_status">Verification Status</Label>
            <Select value={verificationStatus} onValueChange={setVerificationStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rejection Reason (only show if rejected) */}
          {verificationStatus === 'rejected' && (
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Rejection Reason</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejection..."
                rows={3}
              />
            </div>
          )}

          {/* Verification Notes */}
          <div className="space-y-2">
            <Label htmlFor="verification_notes">Verification Notes (Optional)</Label>
            <Textarea
              id="verification_notes"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Add any additional notes about the verification..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleVerification} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  {getStatusIcon(verificationStatus)}
                  <span className="ml-2">
                    {verificationStatus === 'verified' ? 'Verify Document' : 
                     verificationStatus === 'rejected' ? 'Reject Document' : 'Update Status'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
