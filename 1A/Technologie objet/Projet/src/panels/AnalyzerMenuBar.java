package panels;
import java.awt.Desktop;
import java.awt.Font;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JTextPane;
import frame.AboutFrame;
import frame.Menu;
import tutoriel.CoursRegex;

/** Classe pour la barre de menus de l'analyseur d'expression régulière. */
public class AnalyzerMenuBar {
	
	/** La fenêtre principale. */
	private JFrame frame;
    /** Le text Pane des expressions régulières. */
    private JTextPane regexTextPane;

    /** Constructeur de la classe MenuBarMain.
     * @param frame La fenêtre principale.
     */
    public AnalyzerMenuBar(JFrame frame, JTextPane regexTextPane) {
        // créer la fenêtre principale
        this.frame = frame;
        this.regexTextPane = regexTextPane;

        // créer la barre de menus
        JMenuBar menuBar = new JMenuBar();
        

        // créer les menus "File", "Edit", "View" et "Help"
        JMenu fileMenu = new JMenu("Fichier");
        JMenu editMenu = new JMenu("Edition");
        JMenu viewMenu = new JMenu("Affichage");
        JMenu helpMenu = new JMenu("Aide");

        // créer les éléments de menu pour "File"
        JMenuItem newMenuItem = new JMenuItem("Nouveau");
        JMenuItem openMenuItem = new JMenuItem("Ouvrir");
        JMenuItem saveTestMenuItem = new JMenuItem("Enregistrer");
        JMenuItem importRegexMenuItem = new JMenuItem("Importer Regex");
        JMenuItem exportRegexMenuItem = new JMenuItem("Exporter Regex");
        JMenuItem exitMenuItem = new JMenuItem("Quitter");

        // créer les éléments de menu pour "Edit"
        JMenuItem cutMenuItem = new JMenuItem("Couper");
        JMenuItem copyMenuItem = new JMenuItem("Copier");
        JMenuItem pasteMenuItem = new JMenuItem("Coller");
        JMenuItem selectAllMenuItem = new JMenuItem("Sélectionner tout");

        // créer les éléments de menu pour "View"
        JMenuItem zoomInMenuItem = new JMenuItem("Zommer");
        JMenuItem zoomOutMenuItem = new JMenuItem("Dézoomer");

        // créer les éléments de menu pour "Help"
        JMenuItem aboutMenuItem = new JMenuItem("À propos");
        JMenuItem tutorielMenuItem = new JMenuItem("Tutoriel");
        JMenuItem constructMenuItem = new JMenuItem("Constructeur");

        // ajouter les éléments de menu aux menus correspondants
        fileMenu.add(newMenuItem);
        fileMenu.add(openMenuItem);
        fileMenu.add(saveTestMenuItem);
        fileMenu.add(importRegexMenuItem);
        fileMenu.add(exportRegexMenuItem);
        fileMenu.addSeparator();
        fileMenu.add(exitMenuItem);

        editMenu.add(cutMenuItem);
        editMenu.add(copyMenuItem);
        editMenu.add(pasteMenuItem);
        editMenu.addSeparator();
        editMenu.add(selectAllMenuItem);

        viewMenu.add(zoomInMenuItem);
        viewMenu.add(zoomOutMenuItem);
        helpMenu.add(aboutMenuItem);
        helpMenu.add(tutorielMenuItem);
        helpMenu.add(constructMenuItem);

        // ajouter les menus à la barre de menus
        menuBar.add(fileMenu);
        menuBar.add(editMenu);
        menuBar.add(viewMenu);
        menuBar.add(helpMenu);

        // ajouter les listeners aux éléments de menu
        constructMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                try {
                    new Menu();
                } catch (IOException e1) {
                    e1.printStackTrace();
                }
            }
        });

        newMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                // Ouvre un nouveau fichier texte untitled
                JFileChooser fileChooser = new JFileChooser();
                int returnValue = fileChooser.showSaveDialog(null); // afficher la boîte de dialogue "Enregistrer sous"
                if (returnValue == JFileChooser.APPROVE_OPTION) {
                    File file = fileChooser.getSelectedFile();
                    try {
                        if (!file.exists()) {
                            file.createNewFile();
                        }
                        FileWriter fw = new FileWriter(file);
                        fw.close();
                        // Ouvrir le fichier enregistré
                        Desktop.getDesktop().open(file);
                    } catch (IOException ex) {
                        ex.printStackTrace();
                    }
                }
            }
        });

        openMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                // Ouvre un fichier texte
                JFileChooser fileChooser = new JFileChooser();
                int returnValue = fileChooser.showOpenDialog(null); // afficher la boîte de dialogue "Ouvrir"
                if (returnValue == JFileChooser.APPROVE_OPTION) {
                    File file = fileChooser.getSelectedFile();
                    try {
                        // Ouvrir le fichier sélectionné
                        Desktop.getDesktop().open(file);
                    } catch (IOException ex) {
                        ex.printStackTrace();
                    }
                }
            }
        });

        saveTestMenuItem.addActionListener(new ActionListener() {
            @Override
            // Enregistre à la fin d'un nouveau fichier ou d'un fichier choisi l'expression régulière et le test dans un fichier texte sous le format suivant :
            // Expression régulière : <expression régulière>
            // Texte à tester : <texte à tester>
            public void actionPerformed(ActionEvent e) {
                JFileChooser fileChooser = new JFileChooser();
                int returnValue = fileChooser.showSaveDialog(null); // afficher la boîte de dialogue "Enregistrer sous"
                if (returnValue == JFileChooser.APPROVE_OPTION) {
                    File file = fileChooser.getSelectedFile();
                    try {
                        if (!file.exists()) {
                            file.createNewFile();
                        }
                        FileWriter fw = new FileWriter(file, true); // mode "append"
                        fw.write("Expression régulière : " + regexTextPane.getText() + "\n");
                        // Ajouter un saut de ligne à la fin du fichier
                        fw.write(System.getProperty("line.separator"));
                        fw.close();
                    } catch (IOException ex) {
                        ex.printStackTrace();
                    }
                }
            }
        });

        importRegexMenuItem.addActionListener(new ActionListener() {
            @Override
            // mets dans le text pane des expressions régulières le contenu du fichier texte choisi
            public void actionPerformed(ActionEvent e) {
                JFileChooser fileChooser = new JFileChooser();
                int returnValue = fileChooser.showOpenDialog(null); // afficher la boîte de dialogue "Ouvrir"
                if (returnValue == JFileChooser.APPROVE_OPTION) {
                    File file = fileChooser.getSelectedFile();
                    try {
                        // Ouvrir le fichier sélectionné
                        Desktop.getDesktop().open(file);
                        // Lire le fichier sélectionné
                        BufferedReader br = new BufferedReader(new FileReader(file));
                        String line;
                        while ((line = br.readLine()) != null) {
                            regexTextPane.setText(regexTextPane.getText() + line);
                        }
                        br.close();
                    } catch (IOException ex) {
                        ex.printStackTrace();
                    }
                }
            }
        });

        exportRegexMenuItem.addActionListener(new ActionListener() {
            @Override
            // Enregistre dans un fichier texte le contenu du text pane des expressions régulières
            public void actionPerformed(ActionEvent e) {
                JFileChooser fileChooser = new JFileChooser();
                int returnValue = fileChooser.showSaveDialog(null); // afficher la boîte de dialogue "Enregistrer sous"
                if (returnValue == JFileChooser.APPROVE_OPTION) {
                    File file = fileChooser.getSelectedFile();
                    try {
                        if (!file.exists()) {
                            file.createNewFile();
                        }
                        FileWriter fw = new FileWriter(file, true); // mode "append"
                        fw.write(regexTextPane.getText());
                        // Ajouter un saut de ligne à la fin du fichier
                        fw.write(System.getProperty("line.separator"));
                        fw.close();
                    } catch (IOException ex) {
                        ex.printStackTrace();
                    }
                }
            }
        });

        exitMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                System.exit(0);
            }
        });

        cutMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
            	regexTextPane.cut();
            }
        });

        copyMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
            	regexTextPane.copy();
            }
        });

        pasteMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
            	regexTextPane.paste();
            }
        });

        selectAllMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                regexTextPane.selectAll();
            }
        });

        zoomInMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                Font font = regexTextPane.getFont();
                float size = font.getSize() + 1.0f;
                regexTextPane.setFont(font.deriveFont(size));
            }
        });

        zoomOutMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                Font font = regexTextPane.getFont();
                float size = font.getSize() - 1.0f;
                regexTextPane.setFont(font.deriveFont(size));
            }
        });

        aboutMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                try {
					new AboutFrame();
				} catch (IOException e1) {
					e1.printStackTrace();
				}
            }
        });

        tutorielMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                try {
					new CoursRegex();
				} catch (IOException e1) {
					e1.printStackTrace();
				}
            }
        });
                
        // ajouter la barre de menus à la fenêtre
        frame.setJMenuBar(menuBar);
    }

    /** Retourne la fenêtre principale.
     * @return La fenêtre principale.
     */
    public JFrame getFrame() {
        return frame;
    }

    /** Retourne le text pane des expressions régulières.
     * @return Le text pane des expressions régulières.
     */
    public JTextPane getRegexTextPane() {
        return regexTextPane;
    }
}
