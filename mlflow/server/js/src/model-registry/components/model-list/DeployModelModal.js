import React from 'react';
import { GenericInputModal } from '../../../experiment-tracking/components/modals/GenericInputModal';
import { DeployModelForm } from './DeployModelForm';

export const DeployModelModal = ({ isOpen, onClose }) => {
  return (
      <GenericInputModal
          title='Deploy Model'
          okText='Deploy'
          isOpen={isOpen}
          // handleSubmit={this.handleCreateExperiment}
          onClose={onClose}
      >
        <DeployModelForm />
      </GenericInputModal>
  );
}
