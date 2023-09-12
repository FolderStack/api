import { createFolder } from './createFolder';
import { processZip } from './processZip'; // replace with the path to your module
import { uploadToS3 } from './uploadToS3';

// Mock the dependencies
jest.mock('@common/utils', () => ({
    logger: {
        debug: jest.fn(),
    },
}));

jest.mock('./createFolder', () => ({
    createFolder: jest.fn(),
}));
jest.mock('./uploadToS3', () => ({
    uploadToS3: jest.fn(),
}));

const mockCreateFolder = createFolder as jest.MockedFn<typeof createFolder>;
const mockUploadToS3 = uploadToS3 as jest.MockedFn<typeof uploadToS3>;

describe('processZip', () => {
    let mockZip: any;

    beforeEach(() => {
        // Reset all mocked functions
        jest.clearAllMocks();

        // Setup mock ZIP with some default behavior
        mockZip = {
            getEntries: jest.fn().mockReturnValue([]),
        };
    });

    it('should process file entries correctly', async () => {
        const fileEntry = {
            entryName: 'someFile.txt',
            name: 'someFile.txt',
            isDirectory: false,
            getData: jest.fn().mockReturnValue(Buffer.from('file content')),
        };

        mockZip.getEntries.mockReturnValue([fileEntry]);

        await processZip(
            mockZip,
            'root123',
            's3-key-prefix',
            'test-bucket',
            'org123'
        );

        // Check if the file was uploaded to S3 with the expected parameters
        expect(mockUploadToS3).toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/root123_someFile.txt',
            Buffer.from('file content')
        );
    });

    it('should ignore files matching ignored patterns', async () => {
        const ignoredEntry = {
            entryName: '.DS_Store',
            name: '.DS_Store',
            isDirectory: false,
            getData: jest.fn(),
        };

        mockZip.getEntries.mockReturnValue([ignoredEntry]);

        await processZip(
            mockZip,
            'root123',
            's3-key-prefix',
            'test-bucket',
            'org123'
        );

        // Ensure the ignored file was not uploaded
        expect(mockUploadToS3).not.toHaveBeenCalled();
    });

    it('should process directory entries correctly', async () => {
        const directoryEntry = {
            entryName: 'someDirectory/',
            name: 'someDirectory',
            isDirectory: true,
        };
        const fileWithinDirectory = {
            entryName: 'someDirectory/someFile.txt',
            name: 'someFile.txt',
            isDirectory: false,
            getData: jest
                .fn()
                .mockReturnValue(Buffer.from('file content within dir')),
        };

        mockZip.getEntries.mockReturnValue([
            directoryEntry,
            fileWithinDirectory,
        ]);

        mockCreateFolder.mockResolvedValue('newFolder123');

        await processZip(
            mockZip,
            'root123',
            's3-key-prefix',
            'test-bucket',
            'org123'
        );

        // Ensure a new folder was created
        expect(mockCreateFolder).toHaveBeenCalledWith(
            'someDirectory',
            'root123',
            'org123'
        );

        // Ensure the file within the directory was uploaded to S3 with the expected parameters
        expect(mockUploadToS3).toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/newFolder123_someFile.txt',
            Buffer.from('file content within dir')
        );
    });

    it('should handle nested directories', async () => {
        const parentDir = {
            entryName: 'parent/',
            name: 'parent',
            isDirectory: true,
        };
        const nestedDir = {
            entryName: 'parent/nested/',
            name: 'nested',
            isDirectory: true,
        };
        const fileWithinNestedDir = {
            entryName: 'parent/nested/someFile.txt',
            name: 'someFile.txt',
            isDirectory: false,
            getData: jest
                .fn()
                .mockReturnValue(Buffer.from('nested file content')),
        };

        mockZip.getEntries.mockReturnValue([
            parentDir,
            nestedDir,
            fileWithinNestedDir,
        ]);

        mockCreateFolder
            .mockResolvedValueOnce('parentFolder123')
            .mockResolvedValueOnce('nestedFolder456');

        await processZip(
            mockZip,
            'ROOT',
            's3-key-prefix',
            'test-bucket',
            'org123'
        );

        // Ensure nested directories were created
        expect(mockCreateFolder).toHaveBeenCalledWith(
            'parent',
            'ROOT',
            'org123'
        );
        expect(mockCreateFolder).toHaveBeenCalledWith(
            'nested',
            'parentFolder123',
            'org123'
        );

        // Ensure the file within the nested directory was uploaded to S3 with the expected parameters
        expect(mockUploadToS3).toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/nestedFolder456_someFile.txt',
            Buffer.from('nested file content')
        );
    });

    it('should handle a complex directory and file structure', async () => {
        const entries = [
            // Root level files
            {
                entryName: 'rootFile1.txt',
                name: 'rootFile1.txt',
                isDirectory: false,
                getData: jest
                    .fn()
                    .mockReturnValue(Buffer.from('root file 1 content')),
            },
            {
                entryName: 'rootFile2.txt',
                name: 'rootFile2.txt',
                isDirectory: false,
                getData: jest
                    .fn()
                    .mockReturnValue(Buffer.from('root file 2 content')),
            },
            // Ignored file at root
            {
                entryName: '.DS_Store',
                name: '.DS_Store',
                isDirectory: false,
                getData: jest.fn(),
            },
            // First level directory
            {
                entryName: 'dir1/',
                name: 'dir1',
                isDirectory: true,
            },
            {
                entryName: 'dir1/file1.txt',
                name: 'file1.txt',
                isDirectory: false,
                getData: jest
                    .fn()
                    .mockReturnValue(Buffer.from('dir1 file 1 content')),
            },
            {
                entryName: 'dir1/file2.txt',
                name: 'file2.txt',
                isDirectory: false,
                getData: jest
                    .fn()
                    .mockReturnValue(Buffer.from('dir1 file 2 content')),
            },
            // Nested directory
            {
                entryName: 'dir1/nestedDir1/',
                name: 'nestedDir1',
                isDirectory: true,
            },
            {
                entryName: 'dir1/nestedDir1/file1.txt',
                name: 'file1.txt',
                isDirectory: false,
                getData: jest
                    .fn()
                    .mockReturnValue(Buffer.from('nestedDir1 file 1 content')),
            },
            // Ignored file in nested directory
            {
                entryName: 'dir1/nestedDir1/.DS_Store',
                name: '.DS_Store',
                isDirectory: false,
                getData: jest.fn(),
            },
            // Deeply nested directory
            {
                entryName: 'dir1/nestedDir1/deepDir/',
                name: 'deepDir',
                isDirectory: true,
            },
            {
                entryName: 'dir1/nestedDir1/deepDir/file1.txt',
                name: 'file1.txt',
                isDirectory: false,
                getData: jest
                    .fn()
                    .mockReturnValue(Buffer.from('deepDir file 1 content')),
            },
        ];

        mockZip.getEntries.mockReturnValue(entries);
        mockCreateFolder
            .mockResolvedValueOnce('dir1Id')
            .mockResolvedValueOnce('nestedDir1Id')
            .mockResolvedValueOnce('deepDirId');

        await processZip(
            mockZip,
            'root123',
            's3-key-prefix',
            'test-bucket',
            'org123'
        );

        // Ensure directories were created
        expect(mockCreateFolder).toHaveBeenCalledWith(
            'dir1',
            'root123',
            'org123'
        );
        expect(mockCreateFolder).toHaveBeenCalledWith(
            'nestedDir1',
            'dir1Id',
            'org123'
        );
        expect(mockCreateFolder).toHaveBeenCalledWith(
            'deepDir',
            'nestedDir1Id',
            'org123'
        );

        // Ensure the files were uploaded to S3 with the expected parameters
        expect(mockUploadToS3).toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/root123_rootFile1.txt',
            Buffer.from('root file 1 content')
        );
        expect(mockUploadToS3).toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/root123_rootFile2.txt',
            Buffer.from('root file 2 content')
        );
        expect(mockUploadToS3).toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/dir1Id_file1.txt',
            Buffer.from('dir1 file 1 content')
        );
        expect(mockUploadToS3).toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/dir1Id_file2.txt',
            Buffer.from('dir1 file 2 content')
        );
        expect(mockUploadToS3).toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/nestedDir1Id_file1.txt',
            Buffer.from('nestedDir1 file 1 content')
        );
        expect(mockUploadToS3).toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/deepDirId_file1.txt',
            Buffer.from('deepDir file 1 content')
        );

        // Ensure ignored files weren't processed
        expect(mockUploadToS3).not.toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/.DS_Store',
            expect.anything()
        );
        expect(mockUploadToS3).not.toHaveBeenCalledWith(
            'test-bucket',
            's3-key-prefix/nestedDir1Id/.DS_Store',
            expect.anything()
        );
    });
});
