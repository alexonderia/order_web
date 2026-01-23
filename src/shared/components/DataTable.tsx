import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    InputLabel,
    ListItemText,
    Menu,
    MenuItem,
    Select,
    Stack,
    Typography
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

export type DataTableColumn = {
    key: string;
    label: ReactNode;
    align?: 'left' | 'center' | 'right';
    width?: number;
    minWidth?: number;
    fraction?: number;
};

type DataTableProps<T> = {
    columns: DataTableColumn[];
    rows: T[];
    rowKey: (row: T) => string | number;
    renderRow: (row: T) => ReactNode[];
    isLoading?: boolean;
    emptyMessage?: string;
    statusContent?: ReactNode;
    onRowClick?: (row: T) => void;
    showHeader?: boolean;
    enableColumnControls?: boolean;
    defaultHiddenColumnKeys?: string[];
    storageKey?: string;
};

const baseCellSx = {
    paddingY: 1.4,
    paddingX: 1.5,
    borderRight: '1px solid rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    minWidth: 0
};

const resolveAlignment = (align: DataTableColumn['align']) => {
    if (align === 'center') {
        return 'center';
    }

    if (align === 'right') {
        return 'flex-end';
    }

    return 'flex-start';
};

const TableCell = ({
    children,
    isLast,
    align,
    isHeader,
    columnKey,
    showResizer = false,
    onResizeStart,
    setRef
}: {
    children: ReactNode;
    isLast: boolean;
    align?: DataTableColumn['align'];
    isHeader?: boolean;
    columnKey?: string;
    showResizer?: boolean;
    onResizeStart?: (event: ReactMouseEvent<HTMLDivElement>) => void;
    setRef?: (node: HTMLDivElement | null) => void;
}) => (
    <Box
        ref={setRef}
        data-column-key={columnKey}
        data-cell-role={isHeader ? 'header' : 'body'}
        sx={{
            ...baseCellSx,
            borderRight: isLast ? 'none' : baseCellSx.borderRight,
            fontWeight: isHeader ? 700 : 400,
            justifyContent: resolveAlignment(align),
            position: showResizer ? 'relative' : 'static',
            userSelect: showResizer ? 'none' : 'auto',
            backgroundColor: isHeader ? '#cfcfcf' : 'transparent'
        }}
    >
        {children}
        {showResizer && (
            <Box
                onMouseDown={onResizeStart}
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: -4,
                    width: 8,
                    height: '100%',
                    cursor: 'col-resize',
                    zIndex: 2,
                    '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.08)'
                    }
                }}
            />
        )}
    </Box>
);

const renderHeaderLabel = (label: ReactNode) => {
    if (typeof label === 'string' || typeof label === 'number') {
        return <Typography variant="body2">{label}</Typography>;
    }

    return label;
};

export const DataTable = <T,>({
    columns,
    rows,
    rowKey,
    renderRow,
    isLoading = false,
    emptyMessage = 'Данные отсутствуют.',
    statusContent,
    onRowClick,
    showHeader = true,
    enableColumnControls = true,
    defaultHiddenColumnKeys,
    storageKey
}: DataTableProps<T>) => {
    const hasRows = rows.length > 0;
    const columnOrder = useMemo(() => columns.map((column) => column.key), [columns]);
    const hiddenColumnKeys = useMemo(() => defaultHiddenColumnKeys ?? [], [defaultHiddenColumnKeys]);
    const storageKeyValue = storageKey ? `dataTable:${storageKey}` : null;
    const storedState = useMemo(() => {
        if (!storageKeyValue) {
            return null;
        }
        try {
            const raw = sessionStorage.getItem(storageKeyValue);
            if (!raw) {
                return null;
            }
            return JSON.parse(raw) as {
                visibleColumnKeys?: string[];
                columnWidths?: Record<string, number>;
            };
        } catch {
            return null;
        }
    }, [storageKeyValue]);
    const initialVisibleColumnKeys = useMemo(
        () => columns.filter((column) => !hiddenColumnKeys.includes(column.key)).map((column) => column.key),
        [columns, hiddenColumnKeys]
    );
    const initialVisibleColumns = useMemo(() => {
        if (storedState?.visibleColumnKeys?.length) {
            return storedState.visibleColumnKeys;
        }
        return initialVisibleColumnKeys;
    }, [initialVisibleColumnKeys, storedState]);
    const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(initialVisibleColumns);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => storedState?.columnWidths ?? {});
    const tableRef = useRef<HTMLDivElement | null>(null);
    const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
    const headerRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const resizeState = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const normalizeVisibleColumns = useCallback(
        (keys: string[]) => columnOrder.filter((key) => keys.includes(key)),
        [columnOrder]
    );

    useEffect(() => {
        setVisibleColumnKeys((prev) => {
            if (prev.length === 0 || prev.every((key) => !columnOrder.includes(key))) {
                return initialVisibleColumnKeys;
            }
            return normalizeVisibleColumns(prev);
        });
    }, [columnOrder, initialVisibleColumnKeys, normalizeVisibleColumns]);

    useEffect(() => {
        if (!storageKeyValue) {
            return;
        }
        const payload = {
            visibleColumnKeys,
            columnWidths
        };
        sessionStorage.setItem(storageKeyValue, JSON.stringify(payload));
    }, [columnWidths, storageKeyValue, visibleColumnKeys]);

    useLayoutEffect(() => {
        if (!tableRef.current) {
            return;
        }
        const updateWidth = () => {
            setContainerWidth(tableRef.current?.clientWidth ?? 0);
        };
        updateWidth();
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateWidth);
            return () => window.removeEventListener('resize', updateWidth);
        }
        const observer = new ResizeObserver(() => updateWidth());
        observer.observe(tableRef.current);
        return () => observer.disconnect();
    }, []);

    const handleVisibleColumnsChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        const nextKeys = Array.isArray(value) ? value : value.split(',');
        if (nextKeys.length === 0) {
            return;
        }
        setVisibleColumnKeys(normalizeVisibleColumns(nextKeys));
    };

    const handleToggleColumn = (key: string) => {
        setVisibleColumnKeys((prev) => {
            const next = prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key];
            return next.length > 0 ? normalizeVisibleColumns(next) : prev;
        });
    };

    const handleShowAllColumns = () => {
        setVisibleColumnKeys(columnOrder);
    };

    const handleResetWidths = () => {
        setColumnWidths({});
    };

    const handleResizeMove = useCallback(
        (event: MouseEvent) => {
            if (!resizeState.current) {
                return;
            }

            const { key, startX, startWidth } = resizeState.current;
            const nextWidth = Math.max(60, startWidth + event.clientX - startX);
            setColumnWidths((prev) => ({ ...prev, [key]: nextWidth }));
        },
        []
    );

    const handleResizeEnd = useCallback(() => {
        resizeState.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
    }, [handleResizeMove]);

    const handleResizeStart = useCallback(
        (event: ReactMouseEvent<HTMLDivElement>, columnKey: string) => {
            event.preventDefault();
            const headerWidth = headerRefs.current[columnKey]?.offsetWidth ?? 160;
            const currentWidth = columnWidths[columnKey] ?? headerWidth;

            resizeState.current = {
                key: columnKey,
                startX: event.clientX,
                startWidth: currentWidth
            };
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        },
        [columnWidths, handleResizeEnd, handleResizeMove]
    );

    const columnsWithIndex = useMemo(
        () => columns.map((column, index) => ({ ...column, index })),
        [columns]
    );
    const visibleColumns = useMemo(
        () => columnsWithIndex.filter((column) => visibleColumnKeys.includes(column.key)),
        [columnsWithIndex, visibleColumnKeys]
    );
    const gridTemplateColumns = useMemo(() => {
        const totalFraction = visibleColumns.reduce((sum, column) => sum + (column.fraction ?? 1), 0);
        const safeWidth = containerWidth || 0;
        return visibleColumns
            .map((column) => {
                const fraction = column.fraction ?? 1;
                const baseWidth = safeWidth > 0 ? (safeWidth * fraction) / totalFraction : 160;
                const minWidth = column.minWidth ?? 60;
                const userWidth = columnWidths[column.key];
                const targetWidth = typeof userWidth === 'number' ? userWidth : baseWidth;
                return `minmax(${minWidth}px, ${Math.max(minWidth, Math.floor(targetWidth))}px)`;
            })
            .join(' ');
    }, [columnWidths, containerWidth, visibleColumns]);

    const showControls = enableColumnControls && columns.length > 1;
    const settingsOpen = Boolean(settingsAnchor);
    const selectedColumnCountLabel = `Выбрано: ${visibleColumnKeys.length}/${columns.length}`;

    const content = () => {
        if (statusContent) {
            return <Box sx={{ padding: 2 }}>{statusContent}</Box>;
        }

        if (isLoading) {
            return (
                <Box sx={{ padding: 2 }}>
                    <Typography variant="body2">Загрузка...</Typography>
                </Box>
            );
        }

        if (!hasRows) {
            return (
                <Box sx={{ padding: 2 }}>
                    <Typography variant="body2">{emptyMessage}</Typography>
                </Box>
            );
        }

        return rows.map((row) => {
            const cells = renderRow(row);
            return (
                <Box
                    key={rowKey(row)}
                    sx={{
                        display: 'grid',
                        gridTemplateColumns,
                        alignItems: 'stretch',
                        width: 'max-content',
                        minWidth: '100%',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                            backgroundColor: '#ffffff'
                        },
                        cursor: onRowClick ? 'pointer' : 'default'
                    }}
                    onClick={() => onRowClick?.(row)}
                >
                    {visibleColumns.map((column, index) => (
                        <TableCell
                            key={column.key}
                            isLast={index === visibleColumns.length - 1}
                            align={column.align}
                            columnKey={column.key}
                        >
                            {cells[column.index]}
                        </TableCell>
                    ))}
                </Box>
            );
        });
    };

    return (
        <Box
            ref={tableRef}
            sx={{
                backgroundColor: '#d9d9d9',
                borderRadius: 2,
                padding: 2,
                border: '1px solid rgba(0,0,0,0.3)',
                overflowX: 'auto',
                overflowY: 'hidden',
                width: '100%'
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 'max-content' }}>
                {showControls && (
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="space-between"
                    >
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                            <InputLabel id="columns-filter-label">Столбцы</InputLabel>
                            <Select
                                labelId="columns-filter-label"
                                multiple
                                value={visibleColumnKeys}
                                label="Столбцы"
                                onChange={handleVisibleColumnsChange}
                                renderValue={() => selectedColumnCountLabel}
                            >
                                {columns.map((column) => (
                                    <MenuItem key={column.key} value={column.key}>
                                        <Checkbox checked={visibleColumnKeys.includes(column.key)} />
                                        <ListItemText primary={column.label} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button size="small" variant="outlined" onClick={handleShowAllColumns}>
                                Показать все
                            </Button>
                            <Button size="small" variant="outlined" onClick={(event) => setSettingsAnchor(event.currentTarget)}>
                                Настройки
                            </Button>
                        </Stack>
                        <Menu
                            anchorEl={settingsAnchor}
                            open={settingsOpen}
                            onClose={() => setSettingsAnchor(null)}
                            MenuListProps={{ dense: true }}
                        >
                            <MenuItem disabled>Настройка столбцов</MenuItem>
                            {columns.map((column) => (
                                <MenuItem
                                    key={column.key}
                                    onClick={() => handleToggleColumn(column.key)}
                                >
                                    <Checkbox checked={visibleColumnKeys.includes(column.key)} />
                                    <ListItemText primary={column.label} />
                                </MenuItem>
                            ))}
                            <MenuItem onClick={handleShowAllColumns}>Показать все</MenuItem>
                            <MenuItem onClick={handleResetWidths}>Сбросить ширину</MenuItem>
                        </Menu>
                    </Stack>
                )}
                {showHeader && (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns,
                            alignItems: 'stretch',
                            width: 'max-content',
                            minWidth: '100%',
                            borderRadius: 1,
                            overflow: 'hidden',
                            border: '1px solid rgba(0,0,0,0.3)',
                            borderBottom: 'none'
                        }}
                    >
                        {visibleColumns.map((column, index) => (
                            <TableCell
                                key={column.key}
                                isLast={index === visibleColumns.length - 1}
                                align={column.align}
                                columnKey={column.key}
                                isHeader
                                showResizer
                                setRef={(node) => {
                                    headerRefs.current[column.key] = node;
                                }}
                                onResizeStart={(event) => handleResizeStart(event, column.key)}
                            >
                                {renderHeaderLabel(column.label)}
                            </TableCell>
                        ))}
                    </Box>
                )}
                {content()}
            </Box>
        </Box>
    );
};