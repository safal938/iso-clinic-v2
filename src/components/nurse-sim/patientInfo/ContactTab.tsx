import React from 'react';
import { User, Phone, Calendar, Briefcase, FileCheck, FileText, CheckCircle } from 'lucide-react';
import { Patient } from '../../../types/nurse-sim';

interface ContactDetails {
  fullName: string;
  contact: string;
  dob: string;
  address?: string;
  email?: string;
  occupation: string;
  lastVisit: string;
  nextOfKin?: {
    name: string;
    relation: string;
    phone: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    status: string;
  };
}

interface ContactTabProps {
  patient: Patient;
  details: ContactDetails;
}

export const ContactTab: React.FC<ContactTabProps> = ({ patient, details }) => {
  return (
    <div className="grid xl:max-w-[70%] mx-auto grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Contact Information Card - 1st */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-100">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Contact Information</span>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <User size={13} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Full Name</span>
            </div>
            <div className="text-base font-medium text-neutral-900 ml-5">
              {details.fullName}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Phone size={13} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Phone Number</span>
            </div>
            <div className="text-base font-medium text-neutral-900 ml-5">{details.contact}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Calendar size={13} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Date of Birth</span>
            </div>
            <div className="text-base font-medium text-neutral-900 ml-5">{details.dob}</div>
          </div>

          {details.address && (
            <div>
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <User size={13} />
                <span className="text-[9px] font-medium uppercase tracking-wider">Address</span>
              </div>
              <div className="text-base font-medium text-neutral-900 ml-5">{details.address}</div>
            </div>
          )}
        </div>
      </div>

      {/* Next of Kin Card - 2nd */}
      {details.nextOfKin && (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
          <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-100">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Next of Kin</span>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <User size={13} />
                <span className="text-[9px] font-medium uppercase tracking-wider">Name</span>
              </div>
              <div className="text-base font-medium text-neutral-900 ml-5">{details.nextOfKin.name}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <User size={13} />
                <span className="text-[9px] font-medium uppercase tracking-wider">Relation</span>
              </div>
              <div className="text-base font-medium text-neutral-900 ml-5">{details.nextOfKin.relation}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <Phone size={13} />
                <span className="text-[9px] font-medium uppercase tracking-wider">Phone</span>
              </div>
              <div className="text-base font-medium text-neutral-900 ml-5">{details.nextOfKin.phone}</div>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Card - 3rd */}
      {details.insurance && (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
          <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-100">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Insurance Information</span>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <FileCheck size={13} />
                <span className="text-[9px] font-medium uppercase tracking-wider">Provider</span>
              </div>
              <div className="text-base font-medium text-neutral-900 ml-5">{details.insurance.provider}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <FileText size={13} />
                <span className="text-[9px] font-medium uppercase tracking-wider">Policy Number</span>
              </div>
              <div className="text-base font-medium text-neutral-900 ml-5">{details.insurance.policyNumber}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-neutral-400 mb-1">
                <CheckCircle size={13} />
                <span className="text-[9px] font-medium uppercase tracking-wider">Status</span>
              </div>
              <div className="text-base font-medium text-neutral-900 ml-5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {details.insurance.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demographics Card - 4th */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-100">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Demographics</span>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <User size={13} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Age / Gender</span>
            </div>
            <div className="text-base font-medium text-neutral-900 ml-5">{patient.age} years • {patient.gender}</div>
          </div>
        
          <div>
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Briefcase size={13} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Occupation</span>
            </div>
            <div className="text-base font-medium text-neutral-900 ml-5">{details.occupation}</div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Phone size={13} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Contact</span>
            </div>
            <div className="text-base font-medium text-neutral-900 ml-5">{details.contact}</div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Calendar size={13} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Last Visit</span>
            </div>
            <div className="text-base font-medium text-neutral-900 ml-5">{details.lastVisit}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
