import { useContext, useState } from 'react';
import { FormattedMessage, useIntl } from '@edx/frontend-platform/i18n';
import type { UseMutationResult } from '@tanstack/react-query';
import {
  Button, Icon, Scrollable, SelectableBox, Stack, StatefulButton, useCheckboxSetValues,
} from '@openedx/paragon';
import { Folder } from '@openedx/paragon/icons';

import {
  SearchContextProvider,
  SearchKeywordsField,
  SearchSortWidget,
  useSearchContext,
} from '../../../search-manager';
import { ToastContext } from '../../../generic/toast-context';
import { CollectionMetadata } from '../../data/api';
import { useLibraryContext } from '../../common/context/LibraryContext';
import { SidebarActions, useSidebarContext } from '../../common/context/SidebarContext';
import genericMessages from '../messages';
import messages from './messages';

interface ManageCollectionsProps {
  opaqueKey: string;
  collections: CollectionMetadata[],
  useUpdateCollectionsHook: (opaqueKey: string) => UseMutationResult<void, unknown, string[], unknown>;
}

interface CollectionsDrawerProps extends ManageCollectionsProps {
  onClose: () => void;
}

const CollectionsSelectableBox = ({
  opaqueKey,
  collections,
  useUpdateCollectionsHook,
  onClose,
}: CollectionsDrawerProps) => {
  const type = 'checkbox';
  const intl = useIntl();
  const { hits } = useSearchContext();
  const { showToast } = useContext(ToastContext);
  const collectionKeys = collections.map((collection) => collection.key);
  const [selectedCollections, {
    add,
    remove,
  }] = useCheckboxSetValues(collectionKeys);
  const [btnState, setBtnState] = useState('default');

  const updateCollectionsMutation = useUpdateCollectionsHook(opaqueKey);

  const handleConfirmation = () => {
    setBtnState('pending');
    updateCollectionsMutation.mutateAsync(selectedCollections).then(() => {
      showToast(intl.formatMessage(genericMessages.manageCollectionsSuccess));
    }).catch(() => {
      showToast(intl.formatMessage(genericMessages.manageCollectionsFailed));
    }).finally(() => {
      setBtnState('default');
      onClose();
    });
  };

  const handleChange = (e) => (e.target.checked ? add(e.target.value) : remove(e.target.value));

  return (
    <Stack gap={4}>
      <Scrollable className="mt-3 p-1 border-bottom border-gray-100" style={{ height: '25vh' }}>
        <SelectableBox.Set
          value={selectedCollections}
          type={type}
          onChange={handleChange}
          name="selectedCollections"
          columns={1}
          ariaLabelledby={intl.formatMessage(messages.manageCollectionsSelectionLabel)}
        >
          {hits.map((collectionHit) => (
            <SelectableBox
              className="d-inline-flex align-items-center shadow-none border border-gray-100"
              value={collectionHit.blockId}
              key={collectionHit.blockId}
              inputHidden={false}
              type={type}
              aria-label={collectionHit.displayName}
            >
              <Stack className="ml-2" direction="horizontal" gap={2}>
                <Icon src={Folder} />
                <span>{collectionHit.displayName}</span>
              </Stack>
            </SelectableBox>
          ))}
        </SelectableBox.Set>
      </Scrollable>
      <Stack direction="horizontal" gap={2}>
        <Button
          onClick={onClose}
          className="font-weight-bold"
          variant="tertiary"
        >
          {intl.formatMessage(messages.manageCollectionsToComponentCancelBtn)}
        </Button>
        <StatefulButton
          onClick={handleConfirmation}
          className="flex-grow-1 rounded-0"
          variant="primary"
          state={btnState}
          labels={{
            default: intl.formatMessage(messages.manageCollectionsToComponentConfirmBtn),
          }}
        />
      </Stack>
    </Stack>
  );
};

const AddToCollectionsDrawer = ({
  opaqueKey,
  collections,
  useUpdateCollectionsHook,
  onClose,
}: CollectionsDrawerProps) => {
  const intl = useIntl();
  const { libraryId } = useLibraryContext();

  return (
    <SearchContextProvider
      extraFilter={[`context_key = "${libraryId}"`, 'type = "collection"']}
      skipUrlUpdate
      skipBlockTypeFetch
    >
      <Stack className="mt-2" gap={3}>
        <FormattedMessage
          {...messages.manageCollectionsText}
        />
        <Stack gap={1} direction="horizontal">
          <SearchKeywordsField
            className="flex-grow-1"
            placeholder={intl.formatMessage(messages.manageCollectionsSearchPlaceholder)}
          />
          <SearchSortWidget iconOnly />
        </Stack>
        {/* Set key to update selection when entity opaqueKey changes */}
        <CollectionsSelectableBox
          opaqueKey={opaqueKey}
          collections={collections}
          useUpdateCollectionsHook={useUpdateCollectionsHook}
          onClose={onClose}
          key={opaqueKey}
        />
      </Stack>
    </SearchContextProvider>
  );
};

const EntityCollections = ({ collections, onManageClick }: {
  collections?: string[];
  onManageClick: () => void;
}) => {
  const intl = useIntl();
  const { readOnly } = useLibraryContext();

  if (!collections?.length) {
    return (
      <Stack gap={3}>
        <span className="border-bottom pb-3 border-gray-100">
          <FormattedMessage {...messages.componentNotOrganizedIntoCollection} />
        </span>
        {!readOnly && (
          <Button
            onClick={onManageClick}
            variant="primary"
          >
            {intl.formatMessage(messages.manageCollectionsAddBtnText)}
          </Button>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap={4} className="mt-2">
      {collections.map((collection) => (
        <Stack
          className="border-bottom pb-4 border-gray-100"
          gap={2}
          direction="horizontal"
          key={collection}
        >
          <Icon src={Folder} />
          <span>{collection}</span>
        </Stack>
      ))}
      {!readOnly && (
        <Button
          onClick={onManageClick}
          variant="outline-primary"
        >
          {intl.formatMessage(messages.manageCollectionsText)}
        </Button>
      )}
    </Stack>
  );
};

const ManageCollections = ({ opaqueKey, collections, useUpdateCollectionsHook }: ManageCollectionsProps) => {
  const { sidebarAction, resetSidebarAction, setSidebarAction } = useSidebarContext();
  const collectionNames = collections.map((collection) => collection.title);

  return (
    sidebarAction === SidebarActions.JumpToManageCollections
      ? (
        <AddToCollectionsDrawer
          opaqueKey={opaqueKey}
          collections={collections}
          useUpdateCollectionsHook={useUpdateCollectionsHook}
          onClose={() => resetSidebarAction()}
        />
      ) : (
        <EntityCollections
          collections={collectionNames}
          onManageClick={() => setSidebarAction(SidebarActions.JumpToManageCollections)}
        />
      )
  );
};

export default ManageCollections;
