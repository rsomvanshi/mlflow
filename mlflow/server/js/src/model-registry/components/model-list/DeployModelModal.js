import React from 'react';
import { GenericInputModal } from '../../../experiment-tracking/components/modals/GenericInputModal';
import { DeployModelForm } from './DeployModelForm';

export const DeployModelModal = ({ isOpen, onClose, handleSubmit }) => {
  return (
      <GenericInputModal
          title='Deploy Model'
          okText='Deploy'
          isOpen={isOpen}
          handleSubmit={handleSubmit}
          onClose={onClose}
      >
        <DeployModelForm />
      </GenericInputModal>
  );
}
