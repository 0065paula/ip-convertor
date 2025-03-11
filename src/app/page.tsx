'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Copy } from 'lucide-react';

interface FormValues {
  cidr: string;
}

export default function Home() {
  const { t } = useLanguage();
  const [ipRange, setIpRange] = useState<string>('');
  const [networkMask, setNetworkMask] = useState<string>('');
  const [firstIP, setFirstIP] = useState<string>('');
  const [lastIP, setLastIP] = useState<string>('');
  const [totalIPs, setTotalIPs] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const collapsibleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collapsibleRef.current && !collapsibleRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const form = useForm<FormValues>({
    defaultValues: {
      cidr: '',
    },
  });

  const validateCIDR = (cidr: string): boolean => {
    const cidrPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;
    if (!cidrPattern.test(cidr)) {
      return false;
    }

    const parts = cidr.split('/');
    const ipParts = parts[0].split('.');
    for (let i = 0; i < 4; i++) {
      const octet = parseInt(ipParts[i]);
      if (octet < 0 || octet > 255) {
        return false;
      }
    }

    const prefixLength = parseInt(parts[1]);
    if (prefixLength < 0 || prefixLength > 32) {
      return false;
    }

    return true;
  };

  const convertCIDR = (cidr: string) => {
    if (!validateCIDR(cidr)) {
      toast.error(t('invalidFormat'));
      return;
    }

    const [ipPart, prefixPart] = cidr.split('/');
    const prefixLength = parseInt(prefixPart);
    
    const ipOctets = ipPart.split('.').map(octet => parseInt(octet));
    let ipBinary = '';
    ipOctets.forEach(octet => {
      ipBinary += octet.toString(2).padStart(8, '0');
    });
    
    const networkBinary = ipBinary.substring(0, prefixLength).padEnd(32, '0');
    const broadcastBinary = ipBinary.substring(0, prefixLength).padEnd(32, '1');
    
    let firstIPBinary = networkBinary;
    let lastIPBinary = broadcastBinary;
    
    if (prefixLength < 31) {
      firstIPBinary = (BigInt('0b' + networkBinary) + 1n).toString(2).padStart(32, '0');
      lastIPBinary = (BigInt('0b' + broadcastBinary) - 1n).toString(2).padStart(32, '0');
    }
    
    const networkIP = binaryToIP(networkBinary);
    const broadcastIP = binaryToIP(broadcastBinary);
    const firstIPAddress = binaryToIP(firstIPBinary);
    const lastIPAddress = binaryToIP(lastIPBinary);
    
    const subnetMaskBinary = '1'.repeat(prefixLength).padEnd(32, '0');
    const subnetMask = binaryToIP(subnetMaskBinary);
    
    const totalIPAddresses = Math.pow(2, 32 - prefixLength);
    
    setIpRange(`${networkIP} - ${broadcastIP}`);
    setNetworkMask(subnetMask);
    setFirstIP(firstIPAddress);
    setLastIP(lastIPAddress);
    setTotalIPs(totalIPAddresses);
    
    toast.success(t('convertSuccess'));
  };
  
  const binaryToIP = (binary: string): string => {
    const octets = [];
    for (let i = 0; i < 32; i += 8) {
      octets.push(parseInt(binary.substr(i, 8), 2));
    }
    return octets.join('.');
  };

  const onSubmit = (data: FormValues) => {
    convertCIDR(data.cidr);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(t('copySuccess')))
      .catch(() => toast.error(t('copyError')));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Toaster />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t('title')}</h1>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('resultTitle')}</CardTitle>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <div ref={collapsibleRef}>
                <CollapsibleTrigger className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                {t('formatTitle')}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="absolute z-50 mt-2 p-4 bg-white border rounded-lg shadow-lg w-[500px] left-1/2 -translate-x-1/2">
                <div className="relative">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center border rounded overflow-hidden">
                      <div className="bg-blue-100 px-4 py-2 border-r">
                        <code>192.168.1.0</code>
                      </div>
                      <div className="bg-green-100 px-2 py-2">
                        <code>/24</code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-1">{t('networkAddressTitle')}</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>{t('networkAddressDesc1')}</li>
                        <li>{t('networkAddressDesc2')}</li>
                        <li>{t('networkAddressDesc3')}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-600 mb-1">{t('prefixLengthTitle')}</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>{t('prefixLengthDesc1')}</li>
                        <li>{t('prefixLengthDesc2')}</li>
                        <li>{t('prefixLengthDesc3')}</li>
                        <li>{t('prefixLengthDesc4')}</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    <p>{t('example')}</p>
                  </div>
                </div>
              </CollapsibleContent>
              </div>
            </Collapsible>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cidr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('cidrLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('cidrPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">{t('submitButton')}</Button>
              </form>
            </Form>

            {ipRange && (
              <div className="mt-8 space-y-4">
                <h2 className="text-xl font-semibold mb-4">{t('result')}</h2>
                <div className="grid gap-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <Label className="text-sm text-gray-500">{t('ipRangeLabel')}</Label>
                      <div className="font-mono">{ipRange}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(ipRange)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <Label className="text-sm text-gray-500">{t('networkMaskLabel')}</Label>
                      <div className="font-mono">{networkMask}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(networkMask)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <Label className="text-sm text-gray-500">{t('firstIPLabel')}</Label>
                      <div className="font-mono">{firstIP}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(firstIP)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <Label className="text-sm text-gray-500">{t('lastIPLabel')}</Label>
                      <div className="font-mono">{lastIP}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(lastIP)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <Label className="text-sm text-gray-500">{t('totalIPsLabel')}</Label>
                      <div className="font-mono">{totalIPs}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(String(totalIPs))}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
