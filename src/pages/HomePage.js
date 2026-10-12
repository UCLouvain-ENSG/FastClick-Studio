import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Box, 
  Flex, 
  Heading, 
  VStack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Text,
  Tooltip,
  Link
} from '@chakra-ui/react';
import { useAlert } from '../context/AlertContext';


// Address of the FastClick HTTPServer, can be overridden at build time
const DEFAULT_API_URL = process.env.REACT_APP_DEFAULT_API_URL || 'http://192.168.1.1:20000';
const PROBE_TIMEOUT = 2000;
const PROBE_INTERVAL = 5000;

const isValidUrl = (url) => {
  const pattern = /^(https?:\/\/)([a-zA-Z0-9\-\.]+)(:\d+)?(\/.*)?$/
  return pattern.test(url);
};

// Is there a FastClick HTTPServer answering at this address?
const probe = async (url, signal) => {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), PROBE_TIMEOUT);
  const abort = () => timeout.abort();
  signal.addEventListener('abort', abort);
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/config`, { cache: 'no-store', signal: timeout.signal });
    return res.ok;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
};

const StatusIcon = ({ status }) => {
  if (status === 'checking') return <Spinner size="sm" color="gray.400" />;
  if (status === 'ok') return (
    <Tooltip label="FastClick is reachable" hasArrow>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"
           strokeLinecap="round" strokeLinejoin="round" aria-label="FastClick is reachable"><path d="M4 12.5l5 5L20 6.5" /></svg>
    </Tooltip>
  );
  if (status === 'fail') return (
    <Tooltip label="No FastClick HTTPServer answers at this address" hasArrow>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3"
           strokeLinecap="round" aria-label="FastClick is not reachable"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </Tooltip>
  );
  return null;
};

function HomePage() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('apiUrl') || DEFAULT_API_URL);
  const [status, setStatus] = useState('idle');   // idle | checking | ok | fail
  const lastUrl = useRef(null);

  // Live check, like an auto-complete: debounced while typing, then re-checked periodically
  useEffect(() => {
    const url = apiUrl.trim();
    if (!isValidUrl(url)) {
      setStatus('idle');
      return undefined;
    }
    const ctrl = new AbortController();
    let timer;
    const run = async () => {
      if (lastUrl.current !== url) setStatus('checking');
      const ok = await probe(url, ctrl.signal);
      if (ctrl.signal.aborted) return;
      lastUrl.current = url;
      setStatus(ok ? 'ok' : 'fail');
      timer = setTimeout(run, PROBE_INTERVAL);
    };
    timer = setTimeout(run, 400);
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [apiUrl]);

  const handleVisualizeClick = () => {
    if (!apiUrl || !isValidUrl(apiUrl)) {
      showAlert('Error', 'Please enter a valid API URL', 'error');
      return;
    }
    localStorage.setItem('apiUrl', apiUrl.trim().replace(/\/+$/, ''));
    navigate('/config');
  };


  return (
    <Box
      position="relative"
      width="100vw"
      height="100vh"
      overflow="hidden"
      bg="brand.100"
    >
      <Flex
        position="relative"
        zIndex="1"
        w="100%"
        h="100%"
        align="center"
        justify="center"
        flexDir="column"
      >
        <VStack spacing={8} textAlign="center" maxW="2xl" px={4}>
          <Heading
            fontSize="5xl"
            color="brand.900"
            textShadow="2px 2px 4px rgba(0,0,0,0.1)"
            fontFamily="heading"
          >
            FastClick Studio
            <Box as="span" color="brand.500">.</Box>
          </Heading>
          <FormControl isRequired>
            <FormLabel>API URL</FormLabel>
            <InputGroup>
              <Input
                placeholder={`example : ${DEFAULT_API_URL}`}
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVisualizeClick(); }}
                borderColor={status === 'ok' ? 'green.400' : status === 'fail' ? 'red.300' : undefined}
                bg="white"
              />
              <InputRightElement>
                <StatusIcon status={status} />
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleVisualizeClick}
            px={10}
            py={6}
            fontSize="xl"
            borderRadius="xl"
            boxShadow="xl"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: '2xl',
            }}
            transition="all 0.3s ease"
          >
            Visualize FastClick configuration
          </Button>
          <Link 
            href='https://github.com/Naya-01/FastClick-Studio'
            style={
              {
                textDecoration: 'underline',
                color: 'brand.500',
                fontSize: 'lg',
                fontWeight: 'bold',
              }
            }
          >
            Official documentation
          </Link>
        </VStack>
      </Flex>
    </Box>
  );
}

export default HomePage;