import React, { memo, useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useFetchClient, useNotification } from '@strapi/helper-plugin';
import { ArrowLeft as ArrowLeftIcon } from '@strapi/icons';
import { Loader, Link, Box, BaseHeaderLayout, ContentLayout } from '@strapi/design-system';

import pluginId from '../../../helpers/pluginId';
import getTrad from '../../../helpers/getTrad';
import describirError from '../../../helpers/describirError';

import { RedirectForm } from '../../../components/RedirectForm';

const KNOWN_SAVE_ERROR_TYPES = new Set(['DUPLICATE', 'LOOP']);

const RedirectDetailPage = () => {
  const { get, post, put } = useFetchClient();
  const { formatMessage, messages } = useIntl();
  const { id: selectedRedirectId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();
  const toggleNotification = useNotification();
  const [redirect, setRedirect] = useState(undefined);
  const [resetCount, setResetCount] = useState(0);

  const isNewRedirect = window.location.href.endsWith('new');

  const generalSaveErrorMessage = () =>
    formatMessage({ id: getTrad('detail.form.save.notify.error.general.message') });

  /**
   * FORMAT → mensaje del servidor tal cual.
   * Tipos con traducción → i18n.
   * Tipo ausente o sin traducción → mensaje general (nunca …error.undefined.message).
   */
  const resolveSaveErrorMessage = (apiError) => {
    const type = apiError?.details?.type;

    if (type === 'FORMAT' && apiError?.message) {
      return apiError.message;
    }

    if (type && KNOWN_SAVE_ERROR_TYPES.has(type)) {
      const tradId = getTrad(`detail.form.save.notify.error.${type}.message`);
      if (messages && messages[tradId]) {
        return formatMessage({ id: tradId });
      }
      return formatMessage({ id: tradId, defaultMessage: generalSaveErrorMessage() });
    }

    return generalSaveErrorMessage();
  };

  useEffect(() => {
    if (selectedRedirectId) {
      getRedirect();
    }
  }, [selectedRedirectId]);

  const getRedirect = async () => {
    try {
      setIsLoading(true);
      const { data } = await get(`/${pluginId}/${selectedRedirectId}`);

      setRedirect(data);
    } catch (error) {
      console.error('Failed to load redirect:', describirError(error));
      setRedirect(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData, submitMore) => {
    try {
      if (!formData || !formData.from) {
        throw new Error('No form values');
      }

      if (isNewRedirect) {
        const redirect = await createRedirect(formData);

        if (redirect || redirect.id) {
          if (submitMore) {
            setResetCount(resetCount + 1);
          } else {
            history.push(`/plugins/${pluginId}/${redirect.id}`);
          }
        }
      } else {
        await updateRedirect(formData);

        if (submitMore && redirect) {
          history.push(`/plugins/${pluginId}/new`);
        }
      }
    } catch (error) {
      const apiError = error?.response?.data?.error;
      toggleNotification({
        type: 'warning',
        message: resolveSaveErrorMessage(apiError),
      });
    }
  };

  const createRedirect = async (redirect) => {
    const result = await post(`/${pluginId}`, { body: { data: redirect } });

    if (!result.data) {
      toggleNotification({
        type: 'warning',
        message: resolveSaveErrorMessage(result.error),
      });
      return undefined;
    }

    toggleNotification({
      type: 'success',
      message: formatMessage({
        id: getTrad('detail.form.save.notify.success.new.message')
      })
    });

    return { id: result.data.id, ...result.data.attributes };
  };

  const updateRedirect = async (redirect) => {
    await put(`/${pluginId}/${selectedRedirectId}`, {
      body: {
        id: selectedRedirectId,
        data: redirect
      }
    });

    toggleNotification({
      type: 'success',
      message: formatMessage({
        id: getTrad('detail.form.save.notify.success.message')
      })
    });
  };

  return (
    <Box>
      <BaseHeaderLayout
        navigationAction={
          <Link startIcon={<ArrowLeftIcon />} to={`/plugins/${pluginId}`}>
            {formatMessage({ id: getTrad('detail.header.back') })}
          </Link>
        }
        title={formatMessage({
          id: getTrad(isNewRedirect ? 'detail.header.title.new' : 'detail.header.title')
        })}
        as="h2"
      />
      <ContentLayout>
        <Box>
          {isLoading && !isNewRedirect && <Loader />}
          {(!isLoading || isNewRedirect) && (
            <RedirectForm
              initialValues={redirect}
              handleSubmit={handleSubmit}
              isNew={isNewRedirect}
              resetCount={resetCount}
            />
          )}
        </Box>
      </ContentLayout>
    </Box>
  );
};

export default memo(RedirectDetailPage);
