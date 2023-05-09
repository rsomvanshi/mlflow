import React from 'react';
import { GenericInputModal } from '../../../experiment-tracking/components/modals/GenericInputModal';
import { DeployModelForm } from './DeployModelForm';
import {Spinner} from "../../../common/components/Spinner";

export const DeployModelModal = ({ isOpen, onClose, handleSubmit, showLoader }) => {
  return (
      <GenericInputModal
          title='Deploy Model'
          okText='Deploy'
          isOpen={isOpen}
          handleSubmit={handleSubmit}
          onClose={onClose}
      >
          {showLoader && (
              <Spinner />
          )}
        <DeployModelForm />
      </GenericInputModal>
  );
}
