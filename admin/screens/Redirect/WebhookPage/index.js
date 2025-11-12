import React, { memo, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { useFetchClient, useNotification } from '@strapi/helper-plugin';
import {
  Box,
  BaseHeaderLayout,
  ContentLayout,
  Flex,
  Grid,
  GridItem,
  TextInput,
  Button,
  Typography,
  Link,
  IconButton
} from '@strapi/design-system';
import { ArrowLeft as ArrowLeftIcon, Plus, Trash } from '@strapi/icons';

import pluginId from '../../../helpers/pluginId';

const WebhookPage = () => {
  const { formatMessage } = useIntl();
  const { get, post } = useFetchClient();
  const history = useHistory();
  const toggleNotification = useNotification();

  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfig = async () => {
    const { data } = await get(`/${pluginId}/webhook`);
    if (data && data.url) {
        setUrl(data.url || '');
        const loadedHeaders = Array.isArray(data.headers) ? data.headers : [];
        setHeaders(loadedHeaders.length > 0 ? loadedHeaders : [{ key: '', value: '' }]);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleHeaderChange = (index, field, value) => {
    setHeaders((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addHeaderRow = () => setHeaders((prev) => [...prev, { key: '', value: '' }]);
  const removeHeaderRow = (index) => setHeaders((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate URL is not empty
      if (!url || !url.trim()) {
        toggleNotification({ 
          type: 'warning', 
          message: formatMessage({ 
            id: 'redirects.webhook.save.error.emptyUrl', 
            defaultMessage: 'Webhook URL is required.' 
          }) 
        });
        return;
      }
      
      const compactHeaders = headers.filter(h => h.key || h.value);
      const response = await post(`/${pluginId}/webhook`, {
          url: url.trim(),
          headers: compactHeaders,
      });
      
      // Check if the request was successful (2xx status code, including 204 No Content)
      const isSuccess = response.status >= 200 && response.status < 300;
      
      if (isSuccess) {
        toggleNotification({ 
          type: 'success', 
          message: formatMessage({ 
            id: 'redirects.webhook.save.success', 
            defaultMessage: 'Webhook settings saved.' 
          }) 
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (e) {
      const errorMessage = e?.response?.data?.error?.message || e?.message || 'Failed to save webhook settings.';
      toggleNotification({ 
        type: 'warning', 
        message: formatMessage({ 
          id: 'redirects.webhook.save.error', 
          defaultMessage: errorMessage 
        }) 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <BaseHeaderLayout
        navigationAction={
          <Link startIcon={<ArrowLeftIcon />} to={`/plugins/${pluginId}`}>
            {formatMessage({ id: 'redirects.webhook.back', defaultMessage: 'Back' })}
          </Link>
        }
        title={formatMessage({ id: 'redirects.webhook.title', defaultMessage: 'Webhook redirect configuration' })}
        primaryAction={<Button onClick={handleSave} loading={isSaving}>{formatMessage({ id: 'redirects.webhook.save', defaultMessage: 'Save' })}</Button>}
        as="h2"
      />
      <ContentLayout>
        <Box padding={6} background="neutral0" hasRadius shadow="tableShadow">
          <Grid gap={4}>
            <GridItem col={12} s={12}>
              <TextInput
                name="webhookUrl"
                label={formatMessage({ id: 'redirects.webhook.url', defaultMessage: 'Url*' })}
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </GridItem>
            <GridItem col={12} s={12}>
              <Typography variant="delta">
                {formatMessage({ id: 'redirects.webhook.headers', defaultMessage: 'Headers' })}
              </Typography>
            </GridItem>
            {headers.map((h, i) => (
              <React.Fragment key={`hdr-${i}`}>
                <GridItem col={5} s={12}>
                  <TextInput
                    name={`header-key-${i}`}
                    label={formatMessage({ id: 'redirects.webhook.header.key', defaultMessage: 'Key' })}
                    value={h.key}
                    onChange={(e) => handleHeaderChange(i, 'key', e.target.value)}
                  />
                </GridItem>
                <GridItem col={5} s={12}>
                  <TextInput
                    name={`header-value-${i}`}
                    label={formatMessage({ id: 'redirects.webhook.header.value', defaultMessage: 'Value' })}
                    value={h.value}
                    onChange={(e) => handleHeaderChange(i, 'value', e.target.value)}
                  />
                </GridItem>
                <GridItem col={2} s={12}>
                  <Flex alignItems="flex-end" height="100%" gap={2}>
                    <IconButton
                      onClick={() => removeHeaderRow(i)}
                      label={formatMessage({ id: 'redirects.webhook.header.remove', defaultMessage: 'Remove' })}
                      icon={<Trash />}
                    />
                  </Flex>
                </GridItem>
              </React.Fragment>
            ))}
            <GridItem col={12} s={12}>
              <Link onClick={addHeaderRow} startIcon={<Plus />}>
                {formatMessage({ id: 'redirects.webhook.header.add', defaultMessage: 'Create new header' })}
              </Link>
            </GridItem>
          </Grid>
        </Box>
      </ContentLayout>
    </Box>
  );
};

export default memo(WebhookPage);


