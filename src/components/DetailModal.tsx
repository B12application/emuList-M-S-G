// src/components/DetailModal.tsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { MediaItem } from '../types/media';
import MediaCard from './MediaCard';
import { FaTimes } from 'react-icons/fa';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaItem | null;
  refetch: () => void;
}

export default function DetailModal({ isOpen, onClose, item, refetch }: DetailModalProps) {
  if (!item) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-transparent text-left align-middle shadow-xl transition-all relative">
                <button 
                  onClick={onClose}
                  className="absolute top-2 right-2 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer hover:scale-110 shadow-lg border border-white/20"
                  title="Kapat"
                >
                  <FaTimes />
                </button>

                {/* 1. DÜZELTME: isModal={true} ekledik. Artık modal içinde zoom yapmayacak. */}
                <MediaCard item={item} refetch={refetch} isModal={true} />
                
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}