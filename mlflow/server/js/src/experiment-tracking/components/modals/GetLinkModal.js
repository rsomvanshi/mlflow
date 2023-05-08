import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Modal } from '@databricks/design-system';
import { CopyBox } from '../../../shared/building_blocks/CopyBox';

export const GetLinkModal = ({ visible, onCancel, link }) => {
  return (
      <div>
        <Modal
          title={
            <FormattedMessage defaultMessage='Get Link' description={'Title text for get-link modal'} />
          }
          visible={visible}
          onCancel={onCancel}
        >
          <CopyBox copyText={link} />
        </Modal>
        <div>
            For monitoring: <a href="https://ops-xpva.kratos.nvidia.com/d/kratos_xp_k8_namespace_pods/kratos-xp-kubernetes-namespace-pods?orgId=1&refresh=30s&var-datasource=Prometheus&var-namespace=kratos-team" target="_blank" rel="noopener noreferrer">click here</a>
        </div>
      </div>
  );
};

GetLinkModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  link: PropTypes.string.isRequired,
};
